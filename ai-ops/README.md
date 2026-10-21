# AI Ops: PalmPop Studio (Hermes agent system)

An Etsy shop of digital downloads, run by AI agents. **Hermes** (the orchestrator) runs once a day on GitHub Actions and directs four specialists. You approve anything that costs money.

This folder is separate from the AdBlast Miami website code in `src/`.

## How a day works
```
Hermes (daily, GitHub Actions)
 ├─ reads your approve/reject labels on GitHub issues
 ├─ Trend scout   → searches the web for rising + seasonal ideas (weekly, or when the backlog is low)
 ├─ Designer      → writes the full product and renders a print-ready PDF
 ├─ Listing writer→ Etsy title, 13 tags, description, price, AI disclosure
 ├─ Analyst       → weekly: reads shop stats, decides what to make more of / fix / drop
 ├─ every 5 products → opens a GitHub issue asking you to approve the batch
 ├─ each agent adds what it learned to agents/<name>/memory.md
 └─ writes data/reports/YYYY-MM-DD.md
```

## Your job (about 5 minutes a day)
1. Read the daily report in `ai-ops/data/reports/`.
2. When an issue titled **[Hermes] Approve batch…** appears, open the product folders it links to, look at `product.pdf`, and add the label **approved** or **rejected**.
3. Until Etsy publishing is automated, upload approved batches from `ai-ops/data/ready-to-upload/` (each folder has the PDF plus the listing text to copy and paste).

## Setup (one time)
1. **Anthropic API key.** Create one at console.anthropic.com and **set a monthly spend limit of $30** there as a second safety net. In GitHub, go to repo **Settings → Secrets and variables → Actions → New repository secret**, then add `ANTHROPIC_API_KEY`.
2. **Merge this branch into `main`.** GitHub only runs scheduled workflows from the default branch.
3. **Test it.** Go to **Actions → Hermes → Run workflow**. Leave "Dry run" checked the first time (it costs $0 and uploads the sample output as an artifact), then run it once with "Dry run" unchecked.
4. **Etsy.** Open the shop **PalmPopStudio**. When you're ready for hands-off publishing, create an Etsy developer app and I'll wire up the API.

## Dashboard: PalmPop HQ
A neon command-center page (`ai-ops/dashboard/`) shows:
- **Top bar:** revenue, spending against the caps, mode and health
- **Agent roster:** what each agent is doing right now
- **Station map:** each agent's room. Tap a room to see that agent's playbook
- **Needs you:** approvals and uploads waiting on you
- **Production terminal:** product previews
- **Daily report**

It rebuilds itself after every Hermes run.

**Hosting: Cloudflare Pages free plan ($0).** It's allowed for business use, and it never bills overages; if a limit were hit, it would just pause. (Vercel's free plan is for non-commercial use only, which is why we're not using it here.)

One-time setup (**make the repo private first** so your products and numbers aren't public):
1. Create a free account at dash.cloudflare.com, then go to **Workers & Pages → Create → Pages → Connect to Git** and pick this repo.
2. Use these build settings: production branch `main`, root directory `ai-ops/dashboard`, build command `npm run build`, output directory `dist`.
3. Under **Settings → Environment variables**, add `DASHBOARD_PASSWORD` with a strong password. Without it, the page stays locked for everyone.
4. Open `https://<project>.pages.dev`. Your browser asks for a login: any username, plus that password.

Product PDFs are never copied to the dashboard, only preview images.

Preview it locally: `cd ai-ops && npm run dry-run && cd dashboard && npm install && npm run dev`.

## Safety switches
- **Kill switch:** set the repo variable `HERMES_ENABLED` to `false` (Settings → Secrets and variables → Actions → Variables).
- **Hard caps** in `config.json`: $50/month total, $30/month AI, $2.50 per run. No approval can override them.
- Nothing is listed (and no listing fee is spent) without your **approved** label.

## Files
| Path | What it is |
|---|---|
| [VISION.md](VISION.md), [ROADMAP.md](ROADMAP.md), [BUDGET.md](BUDGET.md) | Goals, plan, money rules |
| [research/](research/) | Etsy trends, top-20 products, fees |
| `config.json` | Shop name, model, caps, products per run |
| `agents/*/memory.md` | Each agent's playbook. It grows as they learn, and you can edit it to steer them |
| `src/` | Hermes and the agents (TypeScript, Claude API) |
| `dashboard/` | PalmPop HQ command-center page (Cloudflare Pages) |
| `data/` | Ledger, pipeline, products, reports (written by the bot) |

## Developing
```bash
cd ai-ops && npm install
npm test          # budget caps, approval gate, memory, full dry run
npm run dry-run   # whole pipeline with canned answers, output in .dry-run/
```
