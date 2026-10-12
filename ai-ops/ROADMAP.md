# Roadmap

## Phase 1 — Vision and research (now, $0)
- [x] Vision, KPIs, agent rules (`VISION.md`)
- [x] Trend research and top-20 product list (`research/etsy-trends.md`)
- [x] Fees and break-even (`research/etsy-economics.md`)
- [x] Budget and approval rules (`BUDGET.md`)
- [ ] **Owner:** pick the shop name and confirm the two-lane niche
- [ ] **Owner:** read Etsy's Creativity Standards / AI disclosure rules

## Phase 2 — Build the agent team (weeks 1–2, $0 spend)
- Hermes orchestrator plus specialists (trend scout, designer, listing writer, analyst) using the Claude Agent SDK, scheduled daily by GitHub Actions
- Each agent has its own `memory.md` playbook
- Approval issues, the spend-cap check, the kill switch and daily reports
- Dry run: produce the first 25 products and listing drafts **without publishing**
- **Owner provides:** an Anthropic API key (with a spend limit) as a repo secret

## Phase 3 — Launch (weeks 2–4, about $5–15)
- **Owner:** create the Etsy shop and an Etsy developer app, then authorize the agent's API access
- The owner approves the first batch of 25 → the agents publish
- Priority: the Q4 seasonal items must be live before mid-November

## Phase 4 — Optimize (months 2–3)
- Weekly analyst review: make more variations of winners, rewrite the maybes, let the losers expire
- Grow to 100 listings and build the bundles from the best sellers
- Keep raising average order value with $19–39 kits

## Phase 5 — AdBlast EDDM autopilot (month 3+)
Reuse the same Hermes system on the bigger business:
- Etsy buyers of postcard and flyer templates get offered AdBlast print and mail service (warm leads)
- New agents: a Miami prospector (new business filings and permits), an EDDM route and quote builder, and a mailer designer reusing the Etsy templates
- Outreach drafts go through owner approval and stay CAN-SPAM compliant
- Higher ticket: about $1,500–5,000 per campaign
