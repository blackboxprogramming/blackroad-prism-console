# Template #17 — 📊 Data & Analytics Quality Pulse

**Use:** Weekly or monthly review of dashboards, ETL pipelines, and KPIs.

**Goal:** Catch data drift, broken logic, or silent pipeline failures before they spread bad information.

---

## 🧾 Header
- **HASH ID:** `(DATA-2025-##)`
- **Dataset / Domain:**
- **Data Owner:** `@__`  **Analyst:** `@__`  **Engineer:** `@__`
- **Pulse:** `🟢🟢⚪️⚪️⚪️ → 🟢🟢🟢🟢🟢✅`

---

## 🧩 Stage 1 — Source Validation

| Source | Last Refresh | Status | Notes |
| --- | --- | --- | --- |
| Warehouse Connection | | 🟢/🟡/🔴 | |
| API Feeds | | 🟢/🟡/🔴 | |
| Manual Uploads | | 🟢/🟡/🔴 | |
| Streaming Pipelines | | 🟢/🟡/🔴 | |

- ETL jobs ran successfully (no missing partitions).
- Data volume within expected range (±5%).
- Schema changes reviewed and documented.
- Null or empty value trends checked.
- Security/PII policies enforced on all fields.

---

## 📈 Stage 2 — Metric & KPI Review

| Metric | Definition Source | Last Verified | Current vs Target | Notes |
| --- | --- | --- | --- | --- |
| Revenue | | | | |
| Active Users | | | | |
| NPS | | | | |

- Business logic unchanged since last review.
- SQL/DBT model tests pass.
- KPI definitions documented (no shadow metrics).
- 🟡 If unclear: “I don’t know yet — need confirmation from PM or Data Lead.”

---

## 📊 Stage 3 — Dashboard & Report Validation
- Dashboards load correctly; no broken charts.
- Filters, segments, and drill-downs behave as expected.
- Visuals match source query results.
- Old dashboards archived or deprecated.
- Permissions verified (no sensitive exposure).

---

## 🧠 Stage 4 — Insight Integrity
- Randomly sample 3–5 analyses and reproduce results.
- Verify assumptions and sample size in recent reports.
- Flag insights based on incomplete data.
- Note where new instrumentation or tracking is needed.

---

## 🪶 Automation Hooks
- DBT / Airflow: on job completion, trigger this checklist if any tests fail.
- ClickUp: Label `data-quality` → spawn subtasks per pipeline.
- Slack: `/pulse-data` posts summary table with last-run timestamps.

---

## ✅ Completion Criteria
- All pipelines verified and documented.
- KPIs audited and stable.
- No unauthorized schema or logic drift.
- Pulse `🟢🟢🟢🟢🟢✅`.

---

**Next up:** Template #18 — 🧭 Governance & Compliance Pulse covers audits, policies, and regulatory readiness — the backbone of automation. Keep going?
