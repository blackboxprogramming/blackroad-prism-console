# Board-Level Governance Brief — Q4 2025

## Page 1 — Snapshot (What Matters)

### BlackRoad Governance & Performance – Q4 2025

| KPI | Target | Actual | Trend |
| --- | --- | --- | --- |
| Uptime (30 d) | 99.9 % | 99.95 % | ↗ |
| Latency (p95) | < 1 s | 0.68 s | ↔ |
| Error % (5xx) | < 0.5 % | 0.21 % | ↘ |
| Security Findings | 0 Critical open | 0 | ✅ |
| Change Success Rate | > 98 % | 99.3 % | ↗ |
| Mean Time to Recover (MTTR) | < 15 min | 11 min | ↘ |
| Cost Run-Rate (AWS) | ≤ $X k | $X - 3 % YoY | ↘ |
| Audit Controls Green | ≥ 95 % pass | 98 % | ✅ |

#### Highlights
- Canary + Go/No-Go → zero failed deploys since Sept.
- WAF v2 + Bot Control blocked 4 M malicious reqs (QTD).
- All access reviews complete; evidence auto-generated.
- SOC 2 Type I audit fieldwork scheduled Nov 15.

---

## Page 2 — Risk & Control Heat Map

| Domain | Key Risks / Controls | Status | Owner |
| --- | --- | --- | --- |
| Security | Config drift (AWS Config + Security Hub), Secrets (1P + SSM), WAF coverage | ✅ Green | Sec Ops |
| Change Mgmt | CI + Review + Canary Ladder | ✅ | Eng Lead |
| Access Control | SSO + MFA + Quarterly Review Job | 🟡 – Oct review in progress | Ops |
| Vendor | Airtable tracker + renewal alerts | ✅ | Finance |
| Data | dbt freshness tests + backups | ✅ | Data |
| DR / BCP | Snapshot restore test > Dec 1 | 🟡 – scheduled | Infra |
| Training | Academy Level 1 coverage ≥ 90 % | 92 % | People Ops |

**Risk posture:** Low to Moderate.  
**Top open actions:** Finalize DR test → close Dec 1; complete Okta access review → close Oct 31.

---

## Page 3 — Velocity & Cost Efficiency

### Delivery
- 27 deploys / month (avg) → 2× YoY.
- 0 rollbacks post-canary; mean lead time < 24 h.
- 100 % release notes auto-generated + posted to Slack.
- Feature flags enable safe A/B to 5 % segments.

### Spend
- AWS: -3 % YoY ($X k → $X k).
- Datadog → Grafana switch saved $Y k / yr.
- Snyk + Dependabot cost steady (license tier flat).

### People / Ops
- On-call MTTR 11 min; no critical after-hours pages QTD.
- BlackRoad Academy → 100 % Foundations complete.
- Retention > 97 %.

### Next Quarter Focus
- SOC 2 Type I → Type II prep.
- DR drill + full restore report.
- Expand feature flag coverage to all UI tiles.
- Cost target: -5 % vs Q4 2024.

---

## How It Stays Current

Each metric is fed automatically:
- ALB / WAF metrics → Grafana → API (`/v1/status/metrics`).
- Audit artifacts → Evidence pack job.
- Academy progress → Notion API snapshot.
- Spend → AWS Cost Explorer API daily average.
- Report script (`br-gov-report`) renders Markdown → PDF via CI every Friday 9 AM.

---

## Asana Drops

| Task Name | Description | Assignee Email | Section | Due Date |
| --- | --- | --- | --- | --- |
| Governance brief template | Create Notion page + PDF export format. | amundsonalexa@gmail.com | Today | 2025-10-29 |
| Automate metrics feed | Hook Grafana/WAF/AWS/Notion APIs → br-gov-report. | amundsonalexa@gmail.com | This Week | 2025-10-30 |
| Slack digest | Post weekly Governance Brief (summary 3 lines) to #exec. | amundsonalexa@gmail.com | This Week | 2025-10-31 |
| Board packet | Compile Q4 brief + release evidence for Nov meeting. | amundsonalexa@gmail.com | This Week | 2025-11-01 |

---

## Slack Blurb (#exec)

> Governance Brief v1 is live:
> - Auto-generated every Friday 9 AM
> - 3 pages: Snapshot | Risk | Velocity/Spend
> - Feeds from Grafana, AWS Cost Explorer, Notion Academy, Evidence packs
> Next week: DR test + SOC 2 Type I fieldwork summary.

---

From here you can:
- Plug the brief into an Investor Portal tab in PRISM Hub, or
- Expand it into a single “BlackRoad Scorecard” (one-screen, color-coded, live).

*Want me to take that next — the interactive Scorecard dashboard that reads these metrics live instead of exporting PDFs?*
