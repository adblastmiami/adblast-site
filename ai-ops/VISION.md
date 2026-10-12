# Vision: AI-run Etsy digital-products store

## One-line goal
Build an Etsy shop of original digital downloads that a team of AI agents runs, led by the **Hermes** orchestrator. The agents find what's trending, make products, list them, measure results, and do more of what sells. The owner checks the daily report and approves spending.

## Why Etsy first
- **No inventory and no shipping.** Each sale keeps about 75–88% after fees (see `research/etsy-economics.md`).
- **Low cost to test.** One listing costs $0.20, so 50 test products cost about $10.
- **Fast feedback.** Views, favorites and sales show within weeks, which is what the agents learn from.
- **It trains the system.** The trend → product → listing → analyze loop is the same loop we'll later run for AdBlast EDDM postcards.

## Store concept: two lanes in one shop

Owner confirmed (Oct 12, 2026): go with both lanes below.

**Lane A — Evergreen and higher priced: "small-business marketing kits"**
Editable flyer, postcard, door-hanger, social-post and price-list templates for local service businesses: realtors, cleaners, landscapers, pool, HVAC, salons and food trucks.
- Prices run $9–39. Buyers are business owners, who pay more than hobby buyers.
- It ties directly into AdBlast. A buyer with a postcard template is a warm lead for printing and EDDM mailing.

**Lane B — Seasonal and trending: "viral" quick wins**
Products follow the calendar and rising trends, such as holiday party games, wall art in trending styles, 2027 planners and calendars, and teacher and classroom printables.
- Prices run $3–12, and bundles cost more.
- Volume comes from timing. Holiday searches build 4–8 weeks ahead, so **Q4 2026 products must go live in October/November.**

## Brand
- Name: **PalmPop Studio** (Etsy shop name: `PalmPopStudio`). Short, alliterative, and Miami-bright. It fits both party printables and business templates. No existing Etsy shop with that name turned up in a web search, but Etsy's sign-up will confirm.
- Look: bold, clean and Miami-bright, matching AdBlast. It should feel professional rather than generic AI.

## Price ladder
1. **Entry, $3–5.** A single printable or single template. It gets the first sale and reviews.
2. **Core, $8–15.** A themed set of 5–10 items.
3. **Bundle, $19–39.** A full kit, such as a "Realtor Marketing Kit: 40 templates" or "Ultimate Christmas Party Pack".
Every listing cross-sells the next step up.

## 90-day goals (Oct 2026 → Jan 2027)
| Metric | Day 30 | Day 60 | Day 90 |
|---|---|---|---|
| Live listings | 25 | 60 | 100 |
| Total sales | 5 | 30 | 80 |
| Revenue | $40 | $300 | $900 |
| Reviews | 1 | 5 | 15 |

These are targets, not promises. Most new Etsy shops start slowly. The analyst agent reports progress against these numbers every week.

## KPIs the agents track
- **Views per listing:** is the SEO working?
- **Favorite rate** (favorites ÷ views): is the product appealing?
- **Conversion rate** (orders ÷ visits): is the listing convincing? A typical target is 1–3%.
- **Revenue per listing per month:** which products to make more of.
- **Net profit after fees and AI costs:** the number that matters.

## Learning loop
1. The **trend scout** proposes product ideas with a score for demand, competition and ease of making.
2. The **designer** makes them, and the **listing writer** writes titles, tags and descriptions.
3. The owner approves the batch through a GitHub Issue, and then it's listed.
4. After 14–30 days, the **analyst** sorts listings into winners (make variations), maybes (rewrite title, tags or thumbnail) and losers (let expire).
5. Each agent writes what it learned into its `memory.md` playbook, and Hermes uses those playbooks to plan the next week.

## Rules for the agents
**Allowed:** research trends, design original products, draft listings, read shop stats, write reports, and update their own playbooks.

**Not allowed without owner approval:** publishing listings (each one costs money), turning on ads, changing prices by more than 20%, or messaging customers with anything other than templated thank-you or delivery notes.

**Never:**
- copy another seller's design
- use trademarks, characters, celebrities or brand names (no Disney, NFL, Taylor Swift and so on)
- hide AI involvement (Etsy requires it to be disclosed)
- fake reviews or engagement
- go over the budget cap
