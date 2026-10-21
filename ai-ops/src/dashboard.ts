/** Builds data/dashboard.json, the single file the PalmPop HQ dashboard reads. */
import { existsSync } from "node:fs";
import path from "node:path";
import type { ListingStats } from "./agents/analyst.ts";
import type { Budget } from "./budget.ts";
import type { Config } from "./config.ts";
import { readMemory } from "./memory.ts";
import type { Pipeline } from "./pipeline.ts";
import { readJson } from "./store.ts";

export const CREW = [
  { agent: "hermes", callsign: "HERMES", role: "Orchestrator", room: "bridge" },
  { agent: "trend-scout", callsign: "NOVA", role: "Trend scout", room: "research" },
  { agent: "designer", callsign: "PRISM", role: "Product designer", room: "studio" },
  { agent: "listing-writer", callsign: "QUILL", role: "Listing writer", room: "publishing" },
  { agent: "analyst", callsign: "LEDGER", role: "Shop analyst", room: "treasury" },
] as const;

export const ROOMS = {
  bridge: "Bridge",
  research: "Research Lab",
  studio: "Design Studio",
  publishing: "Publishing Room",
  treasury: "Treasury",
} as const;

export interface DashboardInput {
  cfg: Config;
  p: Pipeline;
  budget: Budget;
  dir: string;
  memoryRoot: string;
  log: string[];
  errors: string[];
  tasks: Record<string, string>;
  report: string;
  dry: boolean;
  now: Date;
}

function playbook(agent: string, root: string) {
  const lines = readMemory(agent, root).split("\n").filter((l) => l.startsWith("- "));
  return { rules: lines.length, latest: lines.slice(-3).map((l) => l.replace(/^- (\[[^\]]*\] )?/, "")) };
}

export function buildDashboard(i: DashboardInput) {
  const { cfg, p, budget } = i;
  const repo = process.env.GITHUB_REPOSITORY ?? cfg.repo;
  const stats = readJson<ListingStats[] | null>(path.join(i.dir, "inbox", "etsy-stats.json"), null);
  const month = i.now.toISOString().slice(0, 7);
  const agentSpend = (agent: string) =>
    budget.entries
      .filter((e) => e.date.startsWith(month) && e.note.startsWith(`${agent} (`))
      .reduce((s, e) => s + e.usd, 0);

  return {
    generatedAt: i.now.toISOString(),
    shopName: cfg.shopName,
    mode: i.dry ? "DRY RUN" : "AUTOPILOT",
    health: i.errors.length ? "ISSUES" : "NOMINAL",
    money: {
      aiMonth: budget.monthSpend("ai"),
      aiCap: cfg.aiMonthlyCapUsd,
      totalMonth: budget.monthSpend(),
      totalCap: cfg.monthlyCapUsd,
      lastRun: budget.runSpendUsd,
    },
    etsy: stats
      ? {
          connected: true,
          revenue: stats.reduce((s, x) => s + x.revenueUsd, 0),
          orders: stats.reduce((s, x) => s + x.orders, 0),
          views: stats.reduce((s, x) => s + x.views, 0),
          live: stats.length,
        }
      : { connected: false, revenue: 0, orders: 0, views: 0, live: 0 },
    rooms: ROOMS,
    agents: CREW.map((c) => ({
      ...c,
      active: c.agent === "hermes" || Boolean(i.tasks[c.agent]),
      task: i.tasks[c.agent] ?? "Standing by",
      spendMonth: agentSpend(c.agent),
      playbook: playbook(c.agent, i.memoryRoot),
    })),
    approvals: p.batches
      .filter((b) => b.status === "pending")
      .map((b) => ({
        id: b.id,
        listings: b.productIds.length,
        feesUsd: b.listingFeesUsd,
        url: `https://github.com/${repo}/issues?q=is%3Aopen+label%3Ahermes-approval+${encodeURIComponent(b.id)}`,
      })),
    uploads: p.batches.filter((b) => b.status === "ready_to_upload").map((b) => b.id),
    products: p.products
      .slice(-24)
      .reverse()
      .map((x) => ({
        id: x.id,
        title: x.title,
        priceUsd: x.priceUsd,
        lane: x.lane,
        created: x.created,
        status: p.batches.find((b) => b.id === x.batchId)?.status ?? "drafted",
        thumb: existsSync(path.join(i.dir, "products", x.id, "thumb.png")) ? `data/thumbs/${x.id}.png` : null,
      })),
    backlog: p.backlog.slice(0, 10).map((b) => ({ name: b.name, lane: b.lane, priceUsd: b.priceUsd, sellBy: b.sellBy })),
    report: i.report,
    log: [...i.log, ...i.errors.map((e) => `ERROR: ${e}`)].slice(-30),
  };
}

export type Dashboard = ReturnType<typeof buildDashboard>;
