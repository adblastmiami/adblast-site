import type { Idea } from "../schemas.ts";
import { ProductSpec } from "../schemas.ts";
import { systemPrompt, type AgentContext } from "./common.ts";

export const NAME = "designer";

export async function designProduct(ctx: AgentContext, idea: Idea): Promise<ProductSpec> {
  return ctx.llm.ask({
    agent: NAME,
    schema: ProductSpec,
    system: systemPrompt(ctx, NAME, "product designer"),
    prompt: `Create the full content for this printable product (US Letter PDF):

${JSON.stringify(idea, null, 2)}

Write every word the buyer will see: real questions, real prompts, real template copy.
Use placeholder brackets like [Your Business Name] and [Phone] for anything the buyer fills in.
Plan 3-8 pages. Include a cover page (layout "poster") and an instructions page.
Pick a bold, clean, Miami-bright palette with readable contrast. It must not look like
generic AI output, so keep copy tight, specific and useful.`,
    mock: () => ({
      title: idea.name,
      palette: { primary: "#FF4F8B", accent: "#14B8A6", background: "#FFF8F0" },
      pages: [
        { heading: idea.name, subheading: "Printable PDF - US Letter", layout: "poster", items: ["Print at home or at any copy shop"] },
        { heading: "Sample page", subheading: "Dry run content", layout: "list", items: ["Item one", "Item two", "Item three"] },
        { heading: "Cut-out cards", subheading: "Dry run content", layout: "cards", items: ["Card A", "Card B", "Card C", "Card D"] },
      ],
      lessons: [],
    }),
  });
}
