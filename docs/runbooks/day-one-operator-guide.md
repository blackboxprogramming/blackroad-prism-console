# BlackRoad — Day-One Operator Guide

This page summarizes the baseline responsibilities, links, rhythms, and checklists for the on-call operator covering PRISM and supporting services.

## What You Own (Today)
- Prod app: `app.blackroad.io` (PRISM)
- API: `api.blackroad.io` (Fastify)
- Infra: ECS Fargate + ALB (blue/green), Route53, WAF, SSM, ECR
- Data: dbt + Snowflake (stg/marts), ingest workers (GitHub, Linear, Stripe)
- Observability: OTel → Grafana or X-Ray, CloudWatch metrics/alarms, Synthetics
- Flags: SSM-backed % rollout + segment targeting
- Release: Release-Please, Go/No-Go bot, Canary ladder (1→50→100)

## Golden Links (Pin These)
- UI health: <https://app.blackroad.io/healthz/ui>
- Canary ladder (Action): Repo → Actions → “deploy-canary-ladder”
- Flags admin: <https://app.blackroadinc.us/admin/flags>
- Dashboards: Grafana “API Golden Signals” (requests/s, p95, error%)
- Status: <https://status.blackroad.io> (cstate)
- PagerDuty: Service “PRISM API” (primary/secondary)
- Runbooks: Notion → BlackRoad Hub → Runbooks

## SLOs (What “Healthy” Means)
- Availability (30d): 99.9% (error budget ≈ 43.2 min)
- Latency (p95): < 1s (rolling 7d)
- Burn-rate alerts: fast (1h) pages; slow (6h) warns in Slack

## Daily Operating Rhythm (10 Minutes)
1. Glance `#releases` (nightly k6 job, alarms overnight).
2. Grafana: 24h p95 and 5xx trend → no step-ups? good.
3. Status page incidents in last 24h? If yes, link them in daily note.
4. Flags diff (version bump?) → skim changes.

## Deploys (Safe Default)
1. Go/No-Go: run gated workflow or confirm bot thread ✅.
2. Canary ladder: run “deploy-canary-ladder” with steps: 1, 50, 100 (default soak 5 min).
3. The ladder auto-runs k6 + ALB baseline checks per step.
4. If any step fails: job auto-rolls back to BLUE and stops.
5. After 100%, post “Shipped” in `#releases` with the tag + change highlights.

### Manual Quick-Rollback (If You’re Ahead of the Bot)
- Action “deploy-canary-ladder” → “rollback-on-failure” path triggers; or
- Modify listener weights to 100% BLUE; update service to prior task definition (noted in workflow logs).

## Feature Rollouts (By User, Not Just Traffic)
- Flip feature in Flags admin.
- `state=conditional`, `percent=1`, add `segments=["staff"]` or `["beta"]`.
- Run at 1% → 5% → 25% → 100% this week.
- Kill switch: set `state=off` or `percent=0` (version auto-bump).
- Preview as: test with your email before wider percent.

## Incidents (Fast Path)
1. **Triage (5 mins):**
   - UI: `/healthz/ui` 200?
   - ALB: spikes in 5xx or p95?
   - WAF: sudden `BlockedRequests`?
   - DB/queue? ingest lag?
2. **Mitigate (10 mins):**
   - Roll back canary to BLUE.
   - Toggle flag off for problematic feature.
   - Rate-limit at WAF if it’s a bot wave.
3. **Communicate (5 mins):**
   - `#releases` thread: “Degraded | scope | action | next update T+15”.
   - Status page: open incident if user-visible.
4. **Recover:** verify p95 & 5xx back to baseline; close incident with root cause sketch.
5. **Blameless post-mortem (same day):** 3 facts, 3 fixes, 1 owner per fix.

## Dashboards (What to Look For)
- API golden signals: requests/s, p95, error %
- Ingress: worker success rate & lag (per connector)
- WAF/ALB overlay: 5xx vs. blocked spikes (attack vs. app)
- Stripe tiles: charges (7d), MRR, active subs (sanity)

## Common Fixes
- CI flaky >10 min: re-prime caches; split tests; keep ten-minute build rule.
- k6 threshold trips: check new endpoints; bump only with evidence and note in runbook.
- Snowflake freshness warn: retry ingest; if two runs miss, page Data owner; don’t ignore.
- Webhook 401s (GitHub/Linear/Stripe): rotate SSM token; re-trigger backfill.

## “First 60 Minutes On-Call” Script
- **0–5:** open Grafana (p95/5xx), `/healthz/ui`, WAF/ALB; post a one-liner in `#releases`.
- **5–15:** rollback canary or toggle flag; confirm recovery on graphs.
- **15–30:** root cause slice (last deploy? new flag? upstream?).
- **30–45:** status page update (impact, timeline, next steps).
- **45–60:** assign follow-ups; add two fixes to retro list.

## Contacts (Lean)
- Primary on-call: PD rotation “BlackRoad Core”
- Infra: `#eng` (ALB/ECS/Route53), Security: `#security` (WAF/Okta/1P)
- Data: `#data` (dbt/warehouse), Product: `#products-prism`

## Checklists (Copy/Paste)

### Go/No-Go DM (Pre-Deploy)
```
Release check:
- CI ✅
- /healthz/ui ✅
- Alarms OK (ALB/WAF) ✅
- Budget steady ✅
- Incidents last 24h: none
Proceeding with canary ladder 1 → 50 → 100.
```

### Incident Opener (Status Page)
```
Summary: Elevated errors on API
Impact: ~X% requests 5xx, p95 > 1s
Start:  HH:MM local
Actions: Rolled back to BLUE; disabled feature X via flag
Next update: +15m
```

## Minimal Runbook Links (Place Under This Guide)
- Deploy & Rollback (screenshots of the ladder + weights)
- Flags Admin (how to preview as, versioning)
- WAF Tuning (rate-limit, allowlist, bot control)
- Data Freshness (what to check, who owns what)
- Post-mortem template (blameless, fixes with owners/dates)

## Asana Drops (Company Cadence Project)
```
Task Name,Description,Assignee Email,Section,Due Date
Publish Day-One Guide,Add this guide to Notion (BlackRoad Hub → Runbooks) and pin links.,amundsonalexa@gmail.com,Today,2025-10-26
Pin dashboards,Pin API Golden Signals + WAF/ALB to Grafana home.,amundsonalexa@gmail.com,Today,2025-10-26
Slack prep,Create canned Go/No-Go + incident opener snippets in #releases.,amundsonalexa@gmail.com,Today,2025-10-26
Runbook screenshots,Add ladder UI and Flags admin screenshots.,amundsonalexa@gmail.com,This Week,2025-10-27
Tabletop drill,30-min drill: break + rollback + comms + close.,amundsonalexa@gmail.com,This Week,2025-10-28
```

> If you want a printable PDF or a lightweight `/ops` portal page with live status badges (SLO, burn-rate, last deploy), flag the Ops tooling squad.
