import path from "node:path";
import type { Config } from "./config.ts";
import { readJson, writeJson } from "./store.ts";

export type SpendKind = "ai" | "etsy";

export interface LedgerEntry {
  date: string;
  kind: SpendKind;
  usd: number;
  note: string;
}

export class BudgetError extends Error {}

/** Tracks every dollar spent. Caps are hard limits that no approval can override. */
export class Budget {
  readonly entries: LedgerEntry[];
  readonly cfg: Config;
  readonly file: string | null;
  readonly now: Date;
  runSpendUsd = 0;

  constructor(cfg: Config, entries: LedgerEntry[], file: string | null, now = new Date()) {
    this.cfg = cfg;
    this.entries = entries;
    this.file = file;
    this.now = now;
  }

  static load(cfg: Config, dir: string, now = new Date()): Budget {
    const file = path.join(dir, "ledger.json");
    return new Budget(cfg, readJson<LedgerEntry[]>(file, []), file, now);
  }

  private month(): string {
    return this.now.toISOString().slice(0, 7);
  }

  monthSpend(kind?: SpendKind): number {
    const m = this.month();
    return this.entries
      .filter((e) => e.date.startsWith(m) && (!kind || e.kind === kind))
      .reduce((sum, e) => sum + e.usd, 0);
  }

  /** Why a spend would be refused, or null if it fits under every cap. */
  blockReason(usd: number, kind: SpendKind): string | null {
    if (this.monthSpend() + usd > this.cfg.monthlyCapUsd)
      return `would exceed the $${this.cfg.monthlyCapUsd}/mo total cap`;
    if (kind === "ai") {
      if (this.monthSpend("ai") + usd > this.cfg.aiMonthlyCapUsd)
        return `would exceed the $${this.cfg.aiMonthlyCapUsd}/mo AI cap`;
      if (this.runSpendUsd + usd > this.cfg.maxRunUsd)
        return `would exceed the $${this.cfg.maxRunUsd} per-run cap`;
    }
    return null;
  }

  canSpend(usd: number, kind: SpendKind): boolean {
    return this.blockReason(usd, kind) === null;
  }

  assertCanSpend(usd: number, kind: SpendKind): void {
    const reason = this.blockReason(usd, kind);
    if (reason) throw new BudgetError(`Blocked: $${usd.toFixed(2)} ${kind} spend ${reason}`);
  }

  record(usd: number, kind: SpendKind, note: string): void {
    if (usd <= 0) return;
    this.entries.push({ date: this.now.toISOString(), kind, usd: Math.round(usd * 10000) / 10000, note });
    if (kind === "ai") this.runSpendUsd += usd;
  }

  save(): void {
    if (this.file) writeJson(this.file, this.entries);
  }
}
