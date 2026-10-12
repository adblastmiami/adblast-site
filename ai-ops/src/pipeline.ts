import path from "node:path";
import type { Budget } from "./budget.ts";
import type { Config } from "./config.ts";
import type { Idea } from "./schemas.ts";
import { readJson, writeJson } from "./store.ts";

export type BacklogIdea = Idea & { id: string; added: string };

export interface Product {
  id: string;
  name: string;
  lane: "A" | "B";
  title: string;
  priceUsd: number;
  created: string;
  batchId: string | null;
}

export type BatchStatus = "pending" | "approved" | "rejected" | "ready_to_upload" | "published";

export interface Batch {
  id: string;
  created: string;
  productIds: string[];
  listingFeesUsd: number;
  status: BatchStatus;
  issue: number | null;
}

export interface Pipeline {
  backlog: BacklogIdea[];
  products: Product[];
  batches: Batch[];
  lastTrendScout: string | null;
  lastAnalysis: string | null;
}

export interface Decision {
  batchId: string;
  issue: number;
  decision: "approved" | "rejected";
}

export function loadPipeline(dir: string): Pipeline {
  return readJson<Pipeline>(path.join(dir, "pipeline.json"), {
    backlog: [],
    products: [],
    batches: [],
    lastTrendScout: null,
    lastAnalysis: null,
  });
}

export function savePipeline(dir: string, p: Pipeline): void {
  writeJson(path.join(dir, "pipeline.json"), p);
}

/** Apply the owner's decisions from GitHub. Only batches still pending can change. */
export function applyDecisions(p: Pipeline, decisions: Decision[]): Decision[] {
  const applied: Decision[] = [];
  for (const d of decisions) {
    const batch = p.batches.find((b) => b.id === d.batchId);
    if (!batch || batch.status !== "pending") continue;
    batch.status = d.decision;
    batch.issue = d.issue;
    applied.push(d);
  }
  return applied;
}

/**
 * The publish gate. A batch goes live only if the owner approved it AND its
 * listing fees fit under the monthly cap. Approval never overrides the cap.
 */
export function publishBlockReason(batch: Batch, budget: Budget): string | null {
  if (batch.status !== "approved") return `batch is ${batch.status}, not approved`;
  return budget.blockReason(batch.listingFeesUsd, "etsy");
}

/** Group drafted products into a batch once there are enough to be worth reviewing. */
export function makeBatch(p: Pipeline, cfg: Config, today: string): Batch | null {
  const loose = p.products.filter((x) => !x.batchId);
  if (loose.length < cfg.batchSize) return null;
  const n = p.batches.filter((b) => b.id.startsWith(today)).length + 1;
  const picked = loose.slice(0, cfg.batchSize);
  const batch: Batch = {
    id: `${today}-${n}`,
    created: today,
    productIds: picked.map((x) => x.id),
    listingFeesUsd: Math.round(picked.length * cfg.listingFeeUsd * 100) / 100,
    status: "pending",
    issue: null,
  };
  for (const x of picked) x.batchId = batch.id;
  p.batches.push(batch);
  return batch;
}
