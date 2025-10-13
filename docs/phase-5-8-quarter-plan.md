# Phase 5–8 Execution Map (Current Quarter)

## Current Foundation Snapshot
- **Unified creator stack already live.** The platform runs as a single-file React SPA with portals for RoadView, RoadCoin, RoadChain, BackRoad, and more, backed by an Express API and local LLM bridge; agents for monetization are already part of the roster.【F:docs/blackroad-research.md†L17-L78】
- **RoadCoin UX and API stubs exist.** The dashboard component already renders wallet balance and transactions using `/api/roadcoin/*` endpoints, so earnings counters can be wired without a ground-up build.【F:frontend/src/components/RoadCoin.jsx†L1-L45】【F:frontend/src/api.js†L49-L62】
- **Narrative/UI assets emphasize visible earnings.** Creative direction for a counter that ticks up on creator actions is defined in the RoadView micro-ad storyboard, giving the design team ready-made motion cues.【F:design/build/roadview/roadview-micro-ad-shotlist.md†L1-L38】
- **Payment primitives scoped.** Agentic payments scenarios spell out mandate-based micropayments and marketplace flows across AP2, MCP, and NET Dollar rails—covering the reward, bounty, and marketplace logic we need to operationalize.【F:docs/agentic-payments-vision.md†L1-L39】
- **Analytics expectations documented.** RoadView’s publish flow already calls for completion, heatmap, and RoadCoin metrics, and KPI catalog entries define ARR/DAU baselines for downstream dashboards.【F:docs/roadview_scene_graph.md†L217-L258】【F:kpi/catalog.yaml†L1-L26】

## Quarter Focus
Deliver a proof-positive revenue loop by fully landing **Phase 5**, pilot **Phase 6** with a curated brand slot test, and stand up the scaffolding (schemas, governance, telemetry) that make Phase 7–8 executable next quarter.

## Phase 5 – Creator Flywheel (Primary Quarter Goal)
**Objective:** ship an end-to-end loop where publishing or collaborating immediately mints visible RoadCoin.

**Quarter deliverables**
1. **Event-to-reward pipeline:** extend the existing `/api/roadcoin/mint` stub into a rules engine (publish, view, referral triggers) and persist earnings with transaction metadata for the SPA wallet component.【F:frontend/src/api.js†L54-L61】【F:frontend/src/components/RoadCoin.jsx†L5-L41】
2. **Live counters everywhere creators work:** surface wallet deltas in RoadView edit/publish screens and BackRoad feeds, using the shotlist motion spec as the pattern for “tick up” feedback.【F:design/build/roadview/roadview-micro-ad-shotlist.md†L27-L36】
3. **Collaboration & referral splits:** leverage the agentic payment mandates to allow posts to tag collaborators and split RoadCoin instantly; cap referral trees via policy constraints from the payments vision doc.【F:docs/agentic-payments-vision.md†L19-L31】
4. **Governance + logging:** use the existing monetization agent scaffolding to log every issuance, tying contradictions/errors back into the analytics SLOs already tracked in the research plan.【F:docs/blackroad-research.md†L63-L142】

**Resourcing & timing**
- Weeks 1–2: finalize issuance rules + DB migrations, wire SPA HUD updates.
- Weeks 3–4: launch collaboration/referral flows with opt-in caps.
- Weeks 5–6: beta with 10 creators, iterate reward rates from telemetry.

## Phase 6 – Brand Economy (Pilot This Quarter)
**Objective:** convert one RoadView layout into a rentable brand slot without introducing ad-tech bloat.

**Quarter deliverables**
1. **Template inventory:** adapt one RoadView scene template into a “brand slot” with time-boxed motion overlays and creator opt-in controls (reusing the storyboard assets for pacing).【F:design/build/roadview/roadview-micro-ad-shotlist.md†L27-L36】
2. **Brand offer workflow:** within the existing portal suite plan, extend RoadView service to store slot availability, approval status, and cash → RoadCoin conversion rules for payouts.【F:docs/portal-suite-plan.md†L3-L125】
3. **Creator brand preferences:** expose toggles in creator dashboards to accept/reject specific brands, defaulting to off.
4. **Treasury conversion:** route brand cash receipts through finance to mint RoadCoin rewards, using payments mandate logic for transparent splits.【F:docs/agentic-payments-vision.md†L19-L31】

**Scope guardrails:** limit pilot to 2–3 aligned brands, fixed 30-day rentals, manual review by product/brand lead.

## Phase 7 – Intelligence Marketplace (Lay Foundations)
**Objective:** prep the agent store without full launch, so next quarter only requires feature polish.

**Quarter deliverables**
1. **Catalog schema + submission flow:** define metadata, pricing, and verification steps for agents/prompts, aligning with existing agent roster and monetization controls.【F:docs/blackroad-research.md†L63-L123】
2. **RoadCoin pricing & escrow rules:** reuse the micropayment playbook to support micro-purchases between agents with platform fee skim.【F:docs/agentic-payments-vision.md†L19-L31】
3. **Sandbox review loop:** integrate with contradiction/guardian agents so every marketplace submission runs through existing safety gates.【F:docs/blackroad-research.md†L63-L140】

**Defer to next quarter:** buyer UX polish, rating systems, automated revenue share payouts.

## Phase 8 – Analytics & Dividends (Scaffolding)
**Objective:** stand up the data model and governance hooks to publish a Creator Index when volume warrants it.

**Quarter deliverables**
1. **Metric model:** extend dbt/KPI catalog with RoadCoin velocity, creator retention, and brand slot utilization metrics aligned to existing ARR/DAU definitions.【F:kpi/catalog.yaml†L1-L26】
2. **Creator Index dashboard stub:** add aggregated views (engagement, monetization, token flow) to the analytics surface already described in the RoadView publishing checklist.【F:docs/roadview_scene_graph.md†L247-L252】
3. **Dividend policy draft:** specify staking eligibility, payout cadence, and treasury split referencing the Economics roadmap (RC issuance + dashboards).【F:docs/blackroad-research.md†L120-L151】
4. **Compliance hooks:** incorporate audit logs + payout evidence into existing SLO/contradiction reporting for transparency.【F:docs/blackroad-research.md†L134-L142】

## Quarter Sequencing
| Weeks | Focus | Notes |
| --- | --- | --- |
| 1–2 | Phase 5 rules engine + HUD polish | Designers finalize motion/visual states; backend lands issuance ledger. |
| 3–4 | Referral/collab splits + brand slot scaffolding | Pilot creators onboarded; finance drafts cash → RC process. |
| 5–6 | Brand pilot live + agent store schema review | Collect analytics; finalize dividend policy draft. |
| 7–8 | Creator Index stub + beta retros | Decide go/no-go for marketplace GA in following quarter. |

## Risks & Mitigations
- **Reward inflation or abuse:** enforce rate caps and per-creator ceilings in the issuance engine; contradiction logs flag anomalies for review.【F:docs/blackroad-research.md†L134-L142】
- **Brand misalignment:** manual review + opt-in toggles ensure creators control placements before broader automation.【F:docs/portal-suite-plan.md†L3-L125】
- **Marketplace trust:** leverage mandate-based escrow and guardian checks before listing any agent, maintaining the symbolic trust stance.【F:docs/agentic-payments-vision.md†L19-L31】【F:docs/blackroad-research.md†L63-L123】

## Immediate Next Steps
1. Convene product + finance to lock RoadCoin issuance rates and treasury conversion policy (end of Week 1).
2. Kick off design sprint on wallet counters + creator HUD states using existing storyboard cues (Week 1).
3. Draft marketplace schema + submission checklist, align with guardian/contradiction review (Week 2).
4. Schedule pilot creator and brand intake interviews to validate assumptions (Weeks 2–3).
