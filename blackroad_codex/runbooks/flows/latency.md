# Flow Latency Runbook

**Symptom:** `flow.latency_ms` exceeds budgets.
**Checks:**

- Datadog monitor `Flow Latency P95`.
- Splunk logs in `audit_*` indexes.

**Remediation:**

1. Verify upstream systems.
2. Scale workers / retry stuck messages.
3. Post update in `#ops`.

**Rollback:**
Revert recent changes via Terraform or flow disable.

**KPIs:** P50/P95, error_budget_burn_pct.
