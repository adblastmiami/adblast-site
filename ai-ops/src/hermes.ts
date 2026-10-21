/**
 * Hermes: the orchestrator. One run per day (GitHub Actions):
 *   1. read the owner's approve/reject decisions
 *   2. package approved batches for upload (inside the budget cap)
 *   3. refill the idea backlog with the trend scout when it runs low (or weekly)
 *   4. have the designer + listing writer turn the best ideas into products
 *   5. group finished products into a batch and ask the owner to approve it
 *   6. weekly: the analyst reviews shop stats
 *   7. save what every agent learned, and write the daily report
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Budget, BudgetError } from "./budget.ts";
import { dataDir, isDryRun, loadConfig, type Config } from "./config.ts";
import { buildDashboard } from "./dashboard.ts";
import { LLM } from "./llm.ts";
import { addLessons } from "./memory.ts";
import {
  applyDecisions,
  loadPipeline,
  makeBatch,
  publishBlockReason,
  savePipeline,
  type Batch,
  type Decision,
  type Pipeline,
} from "./pipeline.ts";
import { renderPdf } from "./render.ts";
import { readJson, slugify, writeJson, writeText } from "./store.ts";
import type { AgentContext } from "./agents/common.ts";
import * as scout from "./agents/trendScout.ts";
import * as designer from "./agents/designer.ts";
import * as writer from "./agents/listingWriter.ts";
import * as analyst from "./agents/analyst.ts";

const DAY = 86_400_000;

function daysSince(date: string | null, now: Date): number {
  return date ? (now.getTime() - new Date(date).getTime()) / DAY : Infinity;
}

export interface RunResult {
  reportFile: string;
  log: string[];
}

export async function runHermes(opts: { cfg?: Config; dir?: string; dryRun?: boolean; now?: Date } = {}): Promise<RunResult> {
  const cfg = opts.cfg ?? loadConfig();
  const dry = opts.dryRun ?? isDryRun();
  const dir = opts.dir ?? dataDir();
  const now = opts.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const log: string[] = [];
  const errors: string[] = [];

  const budget = Budget.load(cfg, dir, now);
  const llm = new LLM(cfg, budget, dry);
  const ctx: AgentContext = { cfg, llm, today, memoryRoot: dry ? dir : path.resolve(dir, "..") };
  const p: Pipeline = loadPipeline(dir);
  const lessons: Record<string, string[]> = {};
  const learn = (agent: string, l: string[]) => (lessons[agent] ??= []).push(...l);
  // Latest thing each agent did this run, shown on the dashboard.
  const tasks: Record<string, string> = {};

  // 1. Owner decisions (written by the GitHub workflow from labeled issues).
  const inbox = path.join(dir, "inbox", "decisions.json");
  const applied = applyDecisions(p, readJson<Decision[]>(inbox, []));
  rmSync(inbox, { force: true });
  for (const d of applied) log.push(`Owner ${d.decision} batch ${d.batchId} (issue #${d.issue}).`);
  if (applied.length) tasks.hermes = `Processed ${applied.length} owner decision(s)`;
  writeJson(path.join(dir, "outbox", "close-issues.json"), applied.map((d) => d.issue));

  // 2. Approved batches → upload package (Etsy API publishing comes once the shop exists).
  for (const batch of p.batches.filter((b) => b.status === "approved")) {
    const blocked = publishBlockReason(batch, budget);
    if (blocked) {
      log.push(`Batch ${batch.id} is approved but on hold: ${blocked}.`);
      continue;
    }
    packageBatch(dir, p, batch);
    batch.status = "ready_to_upload";
    tasks.hermes = `Packaged batch ${batch.id} for upload`;
    log.push(`Batch ${batch.id} packaged in data/ready-to-upload/${batch.id}/ (${batch.productIds.length} listings, $${batch.listingFeesUsd.toFixed(2)} in Etsy fees when uploaded).`);
  }

  try {
    // 3. Trend scout: weekly, or whenever the backlog runs low.
    if (p.backlog.length < cfg.minBacklog || daysSince(p.lastTrendScout, now) >= 7) {
      const known = [...p.backlog.map((i) => i.name), ...p.products.map((x) => x.name)];
      const report = await scout.scoutTrends(ctx, known);
      const seen = new Set(known.map((n) => n.toLowerCase()));
      const fresh = report.ideas.filter((i) => !seen.has(i.name.toLowerCase()));
      p.backlog.push(...fresh.map((i) => ({ ...i, id: slugify(i.name), added: today })));
      p.backlog.sort((a, b) => scout.score(b) - scout.score(a));
      p.lastTrendScout = today;
      learn(scout.NAME, report.lessons);
      log.push(`Trend scout added ${fresh.length} ideas (backlog: ${p.backlog.length}).`);
      tasks[scout.NAME] = `Scanned trends: +${fresh.length} ideas`;
    }

    // 4. Make the best ideas into products.
    for (let i = 0; i < cfg.productsPerRun && p.backlog.length; i++) {
      const idea = p.backlog.shift()!;
      const id = p.products.some((x) => x.id === idea.id) ? `${idea.id}-${today}` : idea.id;
      const spec = await designer.designProduct(ctx, idea);
      learn(designer.NAME, spec.lessons);
      const listing = await writer.writeListing(ctx, idea, spec);
      learn(writer.NAME, listing.lessons);

      const out = path.join(dir, "products", id);
      mkdirSync(out, { recursive: true });
      writeFileSync(path.join(out, "product.pdf"), await renderPdf(spec, cfg.shopName));
      makeThumb(out);
      writeJson(path.join(out, "spec.json"), { idea, ...spec, lessons: undefined });
      writeJson(path.join(out, "listing.json"), { ...listing, lessons: undefined });
      p.products.push({ id, name: idea.name, lane: idea.lane, title: listing.title, priceUsd: listing.priceUsd, created: today, batchId: null });
      log.push(`Made "${idea.name}" ($${listing.priceUsd}, ${spec.pages.length} pages).`);
      tasks[designer.NAME] = `Designed "${idea.name}"`;
      tasks[writer.NAME] = `Wrote listing: ${listing.title.slice(0, 60)}`;
    }

    // 6. Analyst: weekly, once there is something live to judge.
    const stats = readJson<analyst.ListingStats[]>(path.join(dir, "inbox", "etsy-stats.json"), []);
    if (stats.length && daysSince(p.lastAnalysis, now) >= 7) {
      const a = await analyst.analyze(ctx, stats);
      learn(analyst.NAME, a.lessons);
      p.lastAnalysis = today;
      writeJson(path.join(dir, "analysis", `${today}.json`), a);
      log.push(`Analyst: ${a.summary}`);
      tasks[analyst.NAME] = `Reviewed ${stats.length} live listings`;
    }
  } catch (e) {
    if (e instanceof BudgetError) log.push(`Stopped early: ${e.message}`);
    else errors.push(e instanceof Error ? e.message : String(e));
  }

  // 5. Ask the owner to approve a batch.
  let batch: Batch | null;
  while ((batch = makeBatch(p, cfg, today))) {
    writeText(path.join(dir, "outbox", "issues", `${batch.id}.md`), approvalIssue(cfg, p, batch));
    log.push(`Batch ${batch.id} sent to the owner for approval.`);
    tasks.hermes = `Requested approval for batch ${batch.id}`;
  }

  // 7. Learning + report.
  for (const [agent, l] of Object.entries(lessons)) {
    const n = addLessons(agent, l, today, ctx.memoryRoot);
    if (n) log.push(`${agent} learned ${n} new lesson(s).`);
  }
  budget.save();
  savePipeline(dir, p);
  const reportFile = path.join(dir, "reports", `${today}.md`);
  const reportText = report(cfg, p, budget, log, errors, dry, today);
  writeText(reportFile, reportText);
  tasks.hermes ??= "Daily run complete";
  writeJson(
    path.join(dir, "dashboard.json"),
    buildDashboard({ cfg, p, budget, dir, memoryRoot: ctx.memoryRoot, log, errors, tasks, report: reportText, dry, now }),
  );
  if (errors.length) process.exitCode = 1;
  return { reportFile, log: [...log, ...errors.map((e) => `ERROR: ${e}`)] };
}

/** Page 1 as a PNG: the dashboard preview and the Etsy listing photo. Skipped if poppler isn't installed. */
function makeThumb(dir: string): void {
  try {
    execFileSync("pdftoppm", ["-png", "-f", "1", "-l", "1", "-singlefile", "-scale-to", "800", path.join(dir, "product.pdf"), path.join(dir, "thumb")]);
  } catch {
    // No thumbnail; the dashboard shows a placeholder.
  }
}

function packageBatch(dir: string, p: Pipeline, batch: Batch): void {
  const out = path.join(dir, "ready-to-upload", batch.id);
  for (const id of batch.productIds) {
    const src = path.join(dir, "products", id);
    if (!existsSync(src)) continue;
    mkdirSync(path.join(out, id), { recursive: true });
    for (const f of ["product.pdf", "listing.json", "thumb.png"]) {
      if (existsSync(path.join(src, f))) copyFileSync(path.join(src, f), path.join(out, id, f));
    }
  }
  const names = batch.productIds.map((id) => p.products.find((x) => x.id === id)?.title ?? id);
  writeText(path.join(out, "README.md"), `# Upload batch ${batch.id}\n\nFor each folder: create a digital listing on Etsy, upload product.pdf as the file, and copy the title, tags, description and price from listing.json.\n\n${names.map((n) => `- ${n}`).join("\n")}\n`);
}

function approvalIssue(cfg: Config, p: Pipeline, batch: Batch): string {
  const rows = batch.productIds.map((id) => {
    const x = p.products.find((y) => y.id === id)!;
    return `| ${x.title} | ${x.lane} | $${x.priceUsd} | \`ai-ops/data/products/${id}/\` |`;
  });
  return `[Hermes] Approve batch ${batch.id}: ${batch.productIds.length} listings, $${batch.listingFeesUsd.toFixed(2)}

${cfg.shopName} has ${batch.productIds.length} new products ready. Listing them costs **$${batch.listingFeesUsd.toFixed(2)}** in Etsy fees.

| Listing | Lane | Price | Files |
|---|---|---|---|
${rows.join("\n")}

Open each folder to check \`product.pdf\` and \`listing.json\`.

**To approve:** add the \`approved\` label. **To reject:** add the \`rejected\` label.
Hermes picks up the decision on its next run.
`;
}

function report(cfg: Config, p: Pipeline, b: Budget, log: string[], errors: string[], dry: boolean, today: string): string {
  const pending = p.batches.filter((x) => x.status === "pending");
  const ready = p.batches.filter((x) => x.status === "ready_to_upload");
  return `# Hermes daily report: ${today}${dry ? " (DRY RUN, nothing spent)" : ""}

## Money
| | This run | This month | Cap |
|---|---|---|---|
| AI | $${b.runSpendUsd.toFixed(2)} | $${b.monthSpend("ai").toFixed(2)} | $${cfg.aiMonthlyCapUsd} |
| Total | | $${b.monthSpend().toFixed(2)} | $${cfg.monthlyCapUsd} |

## What happened
${log.map((l) => `- ${l}`).join("\n") || "- Nothing to do today."}
${errors.length ? `\n## Problems\n${errors.map((e) => `- ${e}`).join("\n")}\n` : ""}
## Needs you
${pending.length ? pending.map((x) => `- Approve or reject batch ${x.id} (${x.productIds.length} listings)`).join("\n") : "- No approvals waiting."}
${ready.length ? ready.map((x) => `- Upload batch ${x.id} from \`ai-ops/data/ready-to-upload/${x.id}/\``).join("\n") : ""}

## Shop pipeline
- Products made: ${p.products.length}
- Ideas in backlog: ${p.backlog.length}${p.backlog.length ? ` (next up: ${p.backlog.slice(0, 3).map((i) => i.name).join(", ")})` : ""}
- Batches: ${p.batches.length} total, ${pending.length} waiting for approval, ${ready.length} ready to upload
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.env.HERMES_ENABLED === "false") {
    console.log("Hermes is switched off (HERMES_ENABLED=false).");
  } else {
    const { reportFile, log } = await runHermes();
    console.log(log.join("\n"));
    console.log(`\nReport: ${reportFile}`);
  }
}
