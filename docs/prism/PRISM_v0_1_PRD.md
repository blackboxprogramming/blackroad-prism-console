# PRISM v0.1 — Product Requirements (One-Pager)

**Product**: BlackRoad PRISM Console  
**Goal (v0.1)**: Deliver a working slice that authenticates users, connects the first data source, surfaces a live dashboard with two tiles, and ships a guided onboarding experience.  
**Primary User**: Operations / Engineering lead who needs a weekly observability pulse ("is it working? what changed this week?").  
**Non-goals**: Multi-tenant billing, custom roles, advanced theming.

---

## Problem
Teams lack a single, trustworthy view into system health. They rely on brittle dashboards and stale spreadsheets to answer "is it healthy and are we improving?", making it hard to plan their week.

## Hypothesis
If we make it one click to connect Source X and show a trustworthy weekly view (errors, throughput), teams will keep PRISM open and use it to plan work.

## Scope (v0.1)
- **Auth**: OIDC-ready foundation; ship email + magic link, with Slack SSO as a follow-on.
- **Data Source X connector**: Polling or webhook—pick the path of least regret.
- **Dashboard**: Two tiles—"Events last 7 days" and "Errors last 7 days"—each with a sparkline.
- **Onboarding**: Three-step checklist (Create org → Connect source → See data) with progress indicators.
- **Audit log (minimal)**: capture sign-ins, source connections, and configuration changes.

## Definition of Done-Done
- Deployed behind `app.blackroad.io/prism`.
- CI green ≤10 min.
- Documentation updated.
- Demoable with seeded data.
- Tracking events firing end-to-end.

## Risks & Mitigations
| Risk | Mitigation |
| --- | --- |
| Data latency from Source X | Provide seeded data path; design tiles to show "last refreshed". |
| Flaky first connector | Generous timeouts & retries; explicit unsupported-state UI. |
| Auth edge cases | Harden magic link flows; provide clear resend/expired states. |

## Links
- Jira sprint import: [`pm/jira/prism-v01.csv`](../../pm/jira/prism-v01.csv)
- Asana ops support import: [`pm/asana/prism-v01.csv`](../../pm/asana/prism-v01.csv)
- API spec: [`br-api-gateway/openapi.yaml`](../../br-api-gateway/openapi.yaml)
- Dashboard stub: [`apps/web/app/prism/page.tsx`](../../apps/web/app/prism/page.tsx)
- Tracking plan: [`docs/prism/TrackingPlan_v0_1.md`](./TrackingPlan_v0_1.md)
- Data model: [`docs/prism/DataModel_v0_1.md`](./DataModel_v0_1.md)
- Demo script: [`docs/prism/DemoScript_v0_1.md`](./DemoScript_v0_1.md)
- UX brief: [`docs/prism/UX_Brief_v0_1.md`](./UX_Brief_v0_1.md)
- Slack announcements: [`docs/prism/SlackPosts_v0_1.md`](./SlackPosts_v0_1.md)
