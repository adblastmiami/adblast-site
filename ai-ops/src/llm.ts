import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { Budget } from "./budget.ts";
import type { Config } from "./config.ts";

export interface AskOptions<T> {
  agent: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  /** Let the agent search the web (trend research). Billed per search. */
  webSearch?: boolean;
  /** Use the deeper strategy effort level instead of the routine one. */
  deep?: boolean;
  /** Canned answer used in dry runs so the whole pipeline runs for $0. */
  mock: () => T;
}

/** One structured call to Claude, with the budget checked before and recorded after. */
export class LLM {
  readonly cfg: Config;
  readonly budget: Budget;
  readonly dryRun: boolean;
  private client: Anthropic | null = null;

  constructor(cfg: Config, budget: Budget, dryRun: boolean) {
    this.cfg = cfg;
    this.budget = budget;
    this.dryRun = dryRun;
  }

  async ask<T>(opts: AskOptions<T>): Promise<T> {
    if (this.dryRun) return opts.schema.parse(opts.mock());

    this.budget.assertCanSpend(this.cfg.maxCallEstimateUsd, "ai");
    this.client ??= new Anthropic();

    const response = await this.client.beta.messages.parse({
      model: this.cfg.model,
      max_tokens: 16000,
      // If the main model declines, the API retries on a fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
      output_config: {
        effort: opts.deep ? this.cfg.strategyEffort : this.cfg.effort,
        format: betaZodOutputFormat(opts.schema),
      },
      ...(opts.webSearch ? { tools: [{ type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 5 }] } : {}),
    });

    this.budget.record(this.cost(response.usage), "ai", `${opts.agent} (${this.cfg.model})`);

    if (response.stop_reason === "refusal") throw new Error(`${opts.agent}: model declined the request`);
    if (response.stop_reason === "max_tokens") throw new Error(`${opts.agent}: response was cut off`);
    if (!response.parsed_output) throw new Error(`${opts.agent}: response did not match the expected format`);
    return response.parsed_output;
  }

  private cost(usage: Anthropic.Beta.BetaUsage): number {
    const price = this.cfg.pricing[this.cfg.model] ?? { inputPerM: 5, outputPerM: 25 };
    const input =
      (usage.input_tokens ?? 0) +
      (usage.cache_creation_input_tokens ?? 0) * 1.25 +
      (usage.cache_read_input_tokens ?? 0) * 0.1;
    const searches = usage.server_tool_use?.web_search_requests ?? 0;
    return (
      (input * price.inputPerM) / 1e6 +
      ((usage.output_tokens ?? 0) * price.outputPerM) / 1e6 +
      (searches * this.cfg.pricing.webSearchPer1k) / 1000
    );
  }
}
