import { Analysis } from "../schemas.ts";
import { systemPrompt, type AgentContext } from "./common.ts";

export const NAME = "analyst";

export interface ListingStats {
  id: string;
  title: string;
  priceUsd: number;
  daysLive: number;
  views: number;
  favorites: number;
  orders: number;
  revenueUsd: number;
}

export async function analyze(ctx: AgentContext, stats: ListingStats[]): Promise<Analysis> {
  return ctx.llm.ask({
    agent: NAME,
    deep: true,
    schema: Analysis,
    system: systemPrompt(ctx, NAME, "shop analyst"),
    prompt: `Here are the stats for every live listing:
${JSON.stringify(stats, null, 2)}

Judge only listings live for 14+ days. Benchmarks: favorite rate (favorites/views) above 5%
means people like it; conversion (orders/views) of 1-3% is healthy.
Tell us what to make more of, which listings to fix (and exactly how: title, tags, price,
thumbnail), and which to let expire. Lessons must be general rules future runs can use.`,
    mock: () => ({
      summary: `Dry run: ${stats.length} listings reviewed.`,
      makeMoreOf: [],
      fix: [],
      drop: [],
      lessons: [],
    }),
  });
}
