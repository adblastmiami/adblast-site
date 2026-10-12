# Budget and approvals

## Monthly cap: $50 (hard limit, enforced in code once the agents are built)
| Item | Monthly | Notes |
|---|---|---|
| Claude API (Hermes + specialists) | $25–30 | Cheap models for routine work, the strongest model only for weekly strategy. A spend limit is also set in the Anthropic console |
| Etsy listing fees | ~$10 | About 50 new listings per month at $0.20 each |
| Reserve | ~$10 | Renewals, a one-time shop setup fee, or a small ads test, **only if approved** |
| GitHub Actions | $0 | Within the free minutes |

One-time cost: the Etsy shop setup fee (about $15–29, if charged). It needs the owner's OK.

## Approval rules
| Action | Rule |
|---|---|
| Research, designing, drafting listings, writing reports | Automatic |
| Publishing a batch of listings | Agents open a **GitHub Issue** listing the products and their cost. The owner approves it, and the agents then publish |
| Turning on Etsy Ads or any paid tool | Owner approval each time |
| Changing a price by more than 20% | Owner approval |
| Anything that would exceed the monthly cap | **Blocked**, and no approval can override it. The owner must raise the cap in this file |

## Kill switch
Setting the GitHub repo variable `HERMES_ENABLED` to `false` stops all agent runs on the next schedule.

## Money flow
All sales go into the owner's Etsy Payments account. Agents can read the stats but never move or withdraw money.
