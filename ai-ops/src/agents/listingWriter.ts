import type { Idea, ProductSpec } from "../schemas.ts";
import { cleanListing, Listing } from "../schemas.ts";
import { systemPrompt, type AgentContext } from "./common.ts";

export const NAME = "listing-writer";

export function aiDisclosure(shop: string): string {
  return `Designed by ${shop}. AI tools assisted with drafting the content; every product is reviewed and finalized by our team.`;
}

export async function writeListing(ctx: AgentContext, idea: Idea, spec: ProductSpec): Promise<Listing> {
  const disclosure = aiDisclosure(ctx.cfg.shopName);
  const listing = await ctx.llm.ask({
    agent: NAME,
    schema: Listing,
    system: systemPrompt(ctx, NAME, "Etsy listing and SEO writer"),
    prompt: `Write the Etsy listing for this digital download.

Idea: ${JSON.stringify(idea)}
Pages: ${spec.pages.map((p) => `${p.heading} (${p.layout}, ${p.items.length} items)`).join("; ")}

Rules:
- Title: max 140 characters, the phrase a buyer would type goes first, no keyword stuffing.
- Exactly 13 tags, each 20 characters or less, long-tail phrases buyers actually search.
- Description: the first 2 lines sell it (they show in search). Then: what's included,
  page count, size (US Letter PDF), how to print, "digital download - nothing will be shipped",
  and end with this disclosure verbatim: "${disclosure}"
- Price: use the idea's price unless you have a strong reason, ending in .99 or .49.`,
    mock: () => ({
      title: `${idea.name} | Printable PDF | Instant Download`,
      tags: ["printable", "instant download", "digital download", idea.productType],
      description: `${idea.name}. Digital download - nothing will be shipped.\n\n${disclosure}`,
      priceUsd: idea.priceUsd,
      lessons: [],
    }),
  });
  const clean = cleanListing(listing);
  if (!clean.description.includes(disclosure)) clean.description += `\n\n${disclosure}`;
  return clean;
}
