import { z } from "zod";

export const Idea = z.object({
  name: z.string().describe("Short product name, e.g. 'Christmas Party Trivia Game'"),
  lane: z.enum(["A", "B"]).describe("A = evergreen small-business templates, B = seasonal/trending"),
  productType: z.string().describe("e.g. party game, gift tags, flyer template, planner, wall art"),
  priceUsd: z.number(),
  demand: z.number().describe("1-5, how many buyers search for it"),
  competition: z.number().describe("1-5, 5 = least crowded"),
  ease: z.number().describe("1-5, how easy to produce as a printable PDF"),
  sellBy: z.string().describe("Date the listing must be live to catch the season, or 'evergreen'"),
  why: z.string(),
});
export type Idea = z.infer<typeof Idea>;

export const TrendReport = z.object({
  ideas: z.array(Idea),
  lessons: z.array(z.string()).describe("Short, reusable insights for your playbook"),
});
export type TrendReport = z.infer<typeof TrendReport>;

export const ProductPage = z.object({
  heading: z.string(),
  subheading: z.string(),
  layout: z.enum(["list", "cards", "grid", "poster"]).describe(
    "list = numbered lines; cards = 2-column cut-out cards; grid = 3x3 tags/bingo; poster = one big message",
  ),
  items: z.array(z.string()),
});

export const ProductSpec = z.object({
  title: z.string(),
  pages: z.array(ProductPage),
  palette: z.object({
    primary: z.string().describe("hex like #FF5A8A"),
    accent: z.string(),
    background: z.string(),
  }),
  lessons: z.array(z.string()),
});
export type ProductSpec = z.infer<typeof ProductSpec>;

export const Listing = z.object({
  title: z.string().describe("Max 140 characters, most important keywords first"),
  tags: z.array(z.string()).describe("Exactly 13 tags, each max 20 characters"),
  description: z.string(),
  priceUsd: z.number(),
  lessons: z.array(z.string()),
});
export type Listing = z.infer<typeof Listing>;

export const Analysis = z.object({
  summary: z.string(),
  makeMoreOf: z.array(z.string()).describe("Product types or themes to make variations of"),
  fix: z.array(z.string()).describe("Listings to retitle/retag, with what to change"),
  drop: z.array(z.string()),
  lessons: z.array(z.string()),
});
export type Analysis = z.infer<typeof Analysis>;

/** Etsy limits the model can't be trusted to always respect. */
export function cleanListing(l: Listing): Listing {
  const tags = [...new Set(l.tags.map((t) => t.trim().toLowerCase().slice(0, 20)).filter(Boolean))].slice(0, 13);
  return { ...l, title: l.title.slice(0, 140), tags };
}
