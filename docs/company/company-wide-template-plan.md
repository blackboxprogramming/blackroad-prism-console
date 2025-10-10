# Company-wide Template Plan

**Version:** v1.0  
**Owner:** Strategy & Operations (ops@blackroad.io)  
**Last Updated:** 2025-01-17  
**Applies To:** BlackRoad corporate, venture, and protocol entities

---

## 1. Directory Layout & Naming Conventions

```
company-template/
├── README.md                      # Landing page for company-wide templates
├── 00_foundations/                # Cross-cutting assets and starter kits
│   ├── governance/                # Board, committee, crypto-native governance stack
│   ├── compliance/                # Licenses, audits, regulatory trackers
│   ├── security/                  # Identity, access, data protection
│   └── finance/                   # Treasury, billing, fintech rails
├── 10_functions/                  # Department-level playbooks
│   ├── identity/                  # IAM, SSO, credential lifecycle
│   ├── revenue/                   # GTM, CRM, billing
│   ├── product/                   # Roadmaps, UX, research
│   ├── data/                      # Warehousing, analytics, ML
│   ├── operations/                # Support, observability, automation
│   └── people/                    # HRIS, payroll, talent programs
├── 20_rollouts/                   # Phase plans, retro logs, evidence folders
│   ├── phase-assess/              # Due diligence templates
│   ├── phase-launch/              # Activation and training assets
│   ├── phase-harden/              # Reliability, SLO/SLA, controls
│   └── phase-scale/               # Expansion and optimizations
├── 30_catalog/                    # Master catalog by function (Starter Pack inputs)
│   ├── master.csv                 # Canonical inventory reference
│   ├── weekly-touch/              # Starter Pack 15 once prioritized
│   └── archive/                   # Deprecated or long-tail templates
└── 99_ops/                        # Meta work (runbooks, automation hooks)
```

- Folders are numbered in tens to allow inserts without renaming peers.
- Template filenames use `snake_case.md` for Markdown narratives and `kebab-case.yml` for configuration.
- Evidence and artifacts attach in `evidence/<phase>/<function>/<YYYY-MM-DD>/` within the `20_rollouts/` tree.

## 2. Standard Template Header

Each template starts with the same metadata block to keep downstream automation simple.

```
---
title: "<Template Name>"
version: "v1.0"
owner: "name@blackroad.io"
review_cadence: "Quarterly"
linked_systems:
  - name: "System or DAO"
    scope: "Scope of coverage"
    data_classification: "Confidential / Public / Regulated"
audit_evidence:
  - location: "s3://bucket/path" # or "splunk://index/search"
    refresh: "Weekly"
---
```

## 3. Phased Rollout Model

| Phase   | Timebox        | Primary Goal                                 | Key Deliverables                                  | Exit Criteria                                           |
|---------|----------------|----------------------------------------------|----------------------------------------------------|---------------------------------------------------------|
| Assess  | Week 0–1       | Baseline current state, confirm sponsors     | Capability scorecards, risk register, gap matrix   | Sponsors sign-off on scope, gaps categorized            |
| Plan    | Week 2–3       | Produce execution playbooks per function     | Phase Gantt, resource roster, dependency map       | All functions have signed charters & resourcing         |
| Launch  | Week 4–6       | Activate Starter Pack 15 workflows           | Config checklists, training packs, comms schedule  | Automation runbook executed without Sev1 incidents      |
| Harden  | Week 7–10      | Hit SLO/SLA targets, finalize compliance     | SLO dashboards, control attestations, DR drills    | Error budget <1%, compliance sign-off captured          |
| Scale   | Week 11 onward | Expand surface area, optimize operations     | KPI uplift reports, roadmap refresh, backlog sort  | Starter Pack expanded or archived per quarterly review  |

- Every phase maintains a `phase.yaml` with owners, KPIs, and linked evidence buckets.
- Rollback steps track to `20_rollouts/<phase>/<function>/rollback.md` and must be updated alongside new automations.

## 4. Master Catalog by Function

The master catalog anchors the Starter Pack prioritization and provides one-stop traceability for audits.

### 4.1 Identity & Security
- **Core Templates:** `iam_readiness.md`, `zero_trust_runbook.md`, `device_posture.yml`
- **KPIs:** MFA adoption, privileged access reviews, credential MTTR.
- **Crypto Governance Hooks:** Wallet signing policy references, hardware enclave attestations.

### 4.2 Revenue & Finance
- **Core Templates:** `crm_pipeline_health.md`, `billing_reconciliation.yml`, `treasury_cash_cycle.md`
- **KPIs:** Net retention, DSO, error rate on payouts.
- **Crypto Governance Hooks:** Multi-sig treasury operations, on-chain liquidity alerts.

### 4.3 Product & Delivery
- **Core Templates:** `product_requirements.md`, `ux_research_playbook.md`, `release_readiness.md`
- **KPIs:** Release frequency, feature adoption, customer NPS.
- **Crypto Governance Hooks:** Protocol upgrade RFC linkage, DAO proposal dependencies.

### 4.4 Data & Intelligence
- **Core Templates:** `analytics_tracking_plan.md`, `ml_model_registry.yml`, `observability_scorecard.md`
- **KPIs:** Data freshness, lineage coverage, model drift index.
- **Crypto Governance Hooks:** Oracle integrity checks, on-chain/off-chain reconciliation logs.

### 4.5 Operations & Support
- **Core Templates:** `support_escalation_matrix.md`, `incident_command.md`, `automation_backlog.csv`
- **KPIs:** Ticket MTTR, automation coverage, downtime minutes.
- **Crypto Governance Hooks:** Cross-chain incident escalation workflows, validator response SLAs.

### 4.6 People & Governance
- **Core Templates:** `people_ops_cycle.md`, `talent_mobility_framework.md`, `governance_charter.md`
- **KPIs:** Headcount capacity, retention, policy adoption.
- **Crypto Governance Stack:**
  - `dao_multisig_policy.md` – defines signer quorum, rotation schedule, and emergency pause powers.
  - `token_voting_playbook.md` – outlines proposal lifecycle, vote weighting, and delegation rules.
  - `treasury_reporting_template.md` – couples on-chain treasury snapshots with fiat reconciliations.
  - `compliance_mapping.yml` – maps crypto obligations (FATF, MiCA) to internal controls.

## 5. Starter Pack 15 Readiness

- Candidate templates should be tagged with `starter-pack: true` once curated for weekly touchpoints.
- Prioritize high-leverage intersections (e.g., `iam_readiness.md` + `dao_multisig_policy.md`) to keep corporate and crypto operations aligned.
- Each Starter Pack template references the same evidence bucket schema so compliance and governance reviews can be batch processed.

## 6. Next Steps

1. Confirm no additional folders are required before populating `10_functions/` with live content.
2. Publish the Starter Pack 15 list inside `30_catalog/weekly-touch/index.md` with owners and cadence.
3. Wire MCP automations to read the standard header block for metadata ingestion.
4. Schedule the first quarterly review to verify phase exit criteria and governance stack coverage.

---

_Use this template plan as the backbone for departmental rollouts, compliance attestations, and crypto-native governance alignment across BlackRoad._
