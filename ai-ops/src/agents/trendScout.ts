import { TrendReport } from "../schemas.ts";
import { systemPrompt, type AgentContext } from "./common.ts";

export const NAME = "trend-scout";

export async function scoutTrends(ctx: AgentContext, existing: string[]): Promise<TrendReport> {
  return ctx.llm.ask({
    agent: NAME,
    deep: true,
    webSearch: true,
    schema: TrendReport,
    system: systemPrompt(ctx, NAME, "trend scout"),
    prompt: `Search the web for what digital downloads are rising on Etsy, Pinterest and Google right now,
and which seasonal windows open in the next 4-10 weeks.

Propose 8 new product ideas we can make as printable PDFs. Mix both lanes. Favor:
specific niches over generic ones, bundles over single items, and products whose
season is about to start (listings need 2-6 weeks to get found).

Skip anything we already have or planned: ${existing.join("; ") || "(nothing yet)"}`,
    mock: () => ({
      ideas: [
        { name: "Christmas Party Trivia Game", lane: "B", productType: "party game", priceUsd: 6, demand: 5, competition: 2, ease: 5, sellBy: "2026-11-15", why: "Peak Q4 search" },
        { name: "Holiday Gift Tags Bundle", lane: "B", productType: "gift tags", priceUsd: 4, demand: 5, competition: 2, ease: 5, sellBy: "2026-11-20", why: "High volume Q4" },
        { name: "EDDM Postcard Template - Home Cleaning", lane: "A", productType: "postcard template", priceUsd: 19, demand: 3, competition: 5, ease: 4, sellBy: "evergreen", why: "Almost no competition" },
        { name: "Small Business Saturday Promo Kit", lane: "A", productType: "flyer template", priceUsd: 12, demand: 4, competition: 4, ease: 4, sellBy: "2026-11-20", why: "Deadline-driven" },
        { name: "New Year's Eve Party Pack", lane: "B", productType: "party game", priceUsd: 7, demand: 4, competition: 3, ease: 5, sellBy: "2026-12-10", why: "Sells Nov-Dec" },
        { name: "2027 Realtor Planner", lane: "A", productType: "planner", priceUsd: 12, demand: 4, competition: 3, ease: 4, sellBy: "2026-12-01", why: "Niche planner" },
      ],
      lessons: ["Q4 seasonal items must be live by mid-November to catch searches."],
    }),
  });
}

export function score(i: { demand: number; competition: number; ease: number }): number {
  return i.demand * 2 + i.competition + i.ease;
}
