# 30-Day Loop Selection (v0.1)

## Recommendation
Focus the first 30-day rhythm on the **RoadCoin token loop**: give one outsider a working "earn → ledger" experience by wiring the existing wallet endpoints and React component into a small public portal, backed by a manual-but-real payment capture. This path reuses working code today, needs the smallest net-new surface, and still proves the Ship/Earn/Learn cadence with minimal architectural debt.

## Option Scorecard
| Loop | Current assets | Critical gaps | Risk to finish in 30 days |
| --- | --- | --- | --- |
| **Creator (upload → render → payout)** | Rich design brief for RoadView scene graph covering chapters, visuals, assessments, and payout hooks.【F:docs/roadview_scene_graph.md†L1-L140】 | No production service or UI in the repo; RoadView remains a roadmap bullet that still requires upload APIs, ffmpeg workers, and playback shells before payouts are even possible.【F:docs/portal-suite-plan.md†L54-L71】 | **High** – would require multiple greenfield services plus trust/payout plumbing before user value surfaces. |
| **Token (post → earn mock RoadCoin)** | Express router already serves `/api/roadcoin` wallet + mint endpoints, while the front-end ships a RoadCoin wallet component ready to display balance and transactions.【F:src/routes/roadcoin.js†L1-L21】【F:frontend/src/components/RoadCoin.jsx†L1-L44】 | Needs a thin portal wrapper, auth hardening, and a rule for awarding coins tied to a human action. Also must layer in a real-world payment trigger to satisfy the "Earn" milestone. | **Low** – we can extend the existing mocks into a closed beta experience with incremental effort. |
| **SaaS (subscription checkout)** | Subscription router already models plans, invoices, and checkout sessions tied to the SQLite ledger and rate limiter.【F:src/routes/subscribe.js†L1-L168】 | Stripe hooks are stubbed/duplicated, feature gates are inconsistent, and the workflow still expects production billing + customer records we have not provisioned. | **Medium/High** – untangling billing logic plus compliance instrumentation is doable but heavier than the token loop. |

## Why the token loop now
1. **Code is already landing** – `/api/roadcoin/wallet` and `/api/roadcoin/mint` respond today, making it feasible to expose a real loop without inventing net-new infrastructure.【F:src/routes/roadcoin.js†L1-L21】
2. **UI scaffolding exists** – the React wallet card renders balances and transactions, so we only need to wrap it in a minimal public-facing screen and tie minting to a real trigger.【F:frontend/src/components/RoadCoin.jsx†L1-L44】【F:apps/portals/app/roadcoin/page.tsx†L1-L8】
3. **Wallet ledger covers payouts** – the broader wallet routes already mint, transfer, and debit RoadCoin against subscription records, giving us an internal ledger we can lean on for the first payout receipts.【F:src/routes/wallet.js†L11-L147】
4. **Controlled scope, real proof** – we can keep the story tight: one beta landing page, one minted action (e.g., publishing a vetted lesson or completing a security bounty), and one human payout with screenshots/logs as evidence. That satisfies "one stranger completes the loop" without premature platform scope.

## 30-day flight plan (Ship/Earn/Learn)
### Ship (weeks 1–3)
- **Week 1:** Hardening sprint
  - Lock `/api/roadcoin` behind invite tokens + telemetry, and extend the portal page to render the existing wallet component with authentication guard rails.【F:frontend/src/components/RoadCoin.jsx†L1-L44】【F:apps/portals/app/roadcoin/page.tsx†L1-L8】
  - Add a lightweight "submit contribution" form that writes to an internal review queue; approved entries trigger the mint endpoint server-side to avoid client-side abuse.【F:src/routes/roadcoin.js†L1-L21】
- **Week 2:** Beta loop instrumentation
  - Connect the RoadCoin ledger with the broader wallet routes so approved mints show up in transaction history and can be reversed if needed.【F:src/routes/wallet.js†L11-L147】
  - Instrument event logging (mint, review, payout) to a shared dashboard for Friday ritual review.
- **Week 3:** External tester onboarding
  - Ship a passwordless invite flow for one vetted outsider, record a walkthrough video, and document the runbook so anyone on the team can reset the environment.

### Earn (week 2–4)
- Offer a **$10 "Founders Pass" payment link** (Stripe payment link or manual invoice) that, once settled, triggers the admin mint route to credit 100 RC plus unlock the contribution form.【F:src/routes/wallet.js†L101-L147】
- Record the transaction ID, payment receipt, and RoadCoin ledger entry in a shared doc to prove real money hit the account.

### Learn (weekly Friday ritual)
- Stand up a 30-minute Friday retro: "What shipped for the loop, what earned, what broke, what surprised." Capture notes in `/docs/loops/roadcoin/notes.md` (new folder) and prune one distraction each week (e.g., defer leaderboard polish until after the external runs).
- By day 30, summarize metrics: number of contributions submitted, RC minted, manual payouts issued, and overall friction notes. That summary answers "What did we prove this month?"

## What this unlocks next
Landing the token loop creates immediate scaffolding for later cycles:
- **Creator loop alignment:** the same ledger + mint hooks can reward future RoadView uploads when the video pipeline exists, so this work is a forward-compatible building block.【F:docs/roadview_scene_graph.md†L1-L140】
- **SaaS loop readiness:** once we have a documented revenue proof, we can safely refactor the subscription router and layer Stripe webhooks knowing the organization already trusts the Earn cadence.【F:src/routes/subscribe.js†L1-L168】

Deliver the RoadCoin loop first, write down what we proved, and month two can tackle the heavier creator or subscription tracks with confidence.
