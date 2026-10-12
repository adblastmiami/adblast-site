import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { Budget, BudgetError } from "../src/budget.ts";
import { loadConfig } from "../src/config.ts";
import { runHermes } from "../src/hermes.ts";
import { addLessons, readMemory } from "../src/memory.ts";
import { applyDecisions, publishBlockReason, type Batch, type Pipeline } from "../src/pipeline.ts";
import { sanitize } from "../src/render.ts";
import { writeJson } from "../src/store.ts";

const cfg = loadConfig();
const now = new Date("2026-10-12T12:00:00Z");
const tmp = () => mkdtempSync(path.join(tmpdir(), "hermes-"));

test("budget blocks spend over the monthly, AI and per-run caps", () => {
  const b = new Budget(cfg, [{ date: "2026-10-01T00:00:00Z", kind: "etsy", usd: 45, note: "" }], null, now);
  assert.equal(b.canSpend(4, "etsy"), true);
  assert.equal(b.canSpend(6, "etsy"), false);
  assert.throws(() => b.assertCanSpend(6, "ai"), BudgetError);

  const fresh = new Budget(cfg, [], null, now);
  assert.equal(fresh.canSpend(cfg.maxRunUsd + 0.01, "ai"), false);
  fresh.record(cfg.maxRunUsd, "ai", "run");
  assert.equal(fresh.canSpend(0.01, "ai"), false);
});

test("last month's spend does not count against this month", () => {
  const b = new Budget(cfg, [{ date: "2026-09-30T23:00:00Z", kind: "ai", usd: 50, note: "" }], null, now);
  assert.equal(b.monthSpend(), 0);
  assert.equal(b.canSpend(1, "ai"), true);
});

test("publish gate needs approval and still respects the cap", () => {
  const batch: Batch = { id: "b1", created: "2026-10-12", productIds: ["x"], listingFeesUsd: 1, status: "pending", issue: null };
  const roomy = new Budget(cfg, [], null, now);
  assert.match(publishBlockReason(batch, roomy)!, /not approved/);

  batch.status = "approved";
  assert.equal(publishBlockReason(batch, roomy), null);

  const full = new Budget(cfg, [{ date: "2026-10-02T00:00:00Z", kind: "ai", usd: 49.5, note: "" }], null, now);
  assert.match(publishBlockReason(batch, full)!, /cap/);
});

test("decisions only change pending batches", () => {
  const p: Pipeline = {
    backlog: [], products: [], lastTrendScout: null, lastAnalysis: null,
    batches: [
      { id: "a", created: "", productIds: [], listingFeesUsd: 0, status: "pending", issue: null },
      { id: "b", created: "", productIds: [], listingFeesUsd: 0, status: "rejected", issue: 2 },
    ],
  };
  const applied = applyDecisions(p, [
    { batchId: "a", issue: 1, decision: "approved" },
    { batchId: "b", issue: 2, decision: "approved" },
    { batchId: "missing", issue: 3, decision: "approved" },
  ]);
  assert.deepEqual(applied.map((d) => d.batchId), ["a"]);
  assert.equal(p.batches[1].status, "rejected");
});

test("lessons are appended once, playbook header kept", () => {
  const root = tmp();
  addLessons("x", ["Lesson one", "Lesson two"], "2026-10-12", root);
  addLessons("x", ["lesson ONE", "Lesson three"], "2026-10-13", root);
  const text = readMemory("x", root);
  assert.equal(text.match(/lesson one/gi)?.length, 1);
  assert.match(text, /\[2026-10-13\] Lesson three/);
  assert.match(text, /^# x playbook/);
});

test("pdf text is sanitized for built-in fonts", () => {
  assert.equal(sanitize("“Hi” — it’s 🎄 time…"), '"Hi" - it\'s  time...');
});

test("dry run makes products, a batch for approval, and a report without spending", async () => {
  const dir = tmp();
  const small = { ...cfg, productsPerRun: 5, batchSize: 5 };
  const first = await runHermes({ cfg: small, dir, dryRun: true, now });

  assert.equal(readdirSync(path.join(dir, "products")).length, 5);
  assert.ok(existsSync(path.join(dir, "products", "christmas-party-trivia-game", "product.pdf")));
  const issues = readdirSync(path.join(dir, "outbox", "issues"));
  assert.equal(issues.length, 1);
  assert.match(readFileSync(path.join(dir, "outbox", "issues", issues[0]), "utf8"), /^\[Hermes\] Approve batch 2026-10-12-1/);
  assert.match(readFileSync(first.reportFile, "utf8"), /DRY RUN/);
  assert.equal(new Budget(cfg, JSON.parse(readFileSync(path.join(dir, "ledger.json"), "utf8")), null, now).monthSpend(), 0);

  // Owner approves → next run packages the batch for upload.
  writeJson(path.join(dir, "inbox", "decisions.json"), [{ batchId: "2026-10-12-1", issue: 7, decision: "approved" }]);
  await runHermes({ cfg: small, dir, dryRun: true, now });
  assert.ok(existsSync(path.join(dir, "ready-to-upload", "2026-10-12-1", "README.md")));
  assert.deepEqual(JSON.parse(readFileSync(path.join(dir, "outbox", "close-issues.json"), "utf8")), [7]);
});

test("labeled approval issues become decisions; rejection wins", async () => {
  const { parseDecisions } = await import("../src/github.ts");
  const d = parseDecisions([
    { number: 1, title: "[Hermes] Approve batch 2026-10-12-1: 5 listings, $1.00", labels: [{ name: "hermes-approval" }, { name: "approved" }] },
    { number: 2, title: "[Hermes] Approve batch 2026-10-12-2: 5 listings, $1.00", labels: [{ name: "approved" }, { name: "rejected" }] },
    { number: 3, title: "[Hermes] Approve batch 2026-10-13-1: 5 listings, $1.00", labels: [{ name: "hermes-approval" }] },
    { number: 4, title: "Unrelated issue", labels: [{ name: "approved" }] },
  ]);
  assert.deepEqual(d, [
    { batchId: "2026-10-12-1", issue: 1, decision: "approved" },
    { batchId: "2026-10-12-2", issue: 2, decision: "rejected" },
  ]);
});
