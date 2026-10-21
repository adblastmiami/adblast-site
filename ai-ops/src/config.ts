import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export interface ModelPrice {
  inputPerM: number;
  outputPerM: number;
}

export interface Config {
  shopName: string;
  /** owner/name on GitHub, for links to approval issues. */
  repo: string;
  model: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  strategyEffort: "low" | "medium" | "high" | "xhigh" | "max";
  monthlyCapUsd: number;
  aiMonthlyCapUsd: number;
  maxRunUsd: number;
  maxCallEstimateUsd: number;
  listingFeeUsd: number;
  productsPerRun: number;
  batchSize: number;
  minBacklog: number;
  pricing: Record<string, ModelPrice> & { webSearchPer1k: number };
}

export function loadConfig(): Config {
  return JSON.parse(readFileSync(path.join(ROOT, "config.json"), "utf8")) as Config;
}

/** Dry run: no API key, or explicitly requested. Nothing is spent and output goes to .dry-run/. */
export function isDryRun(): boolean {
  return process.env.HERMES_DRY_RUN === "1" || !process.env.ANTHROPIC_API_KEY;
}

export function dataDir(): string {
  if (process.env.HERMES_DATA_DIR) return path.resolve(process.env.HERMES_DATA_DIR);
  return path.join(ROOT, isDryRun() ? ".dry-run" : "data");
}
