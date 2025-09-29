# Compliance Usage Metrics Starter

This starter bundle introduces the **usage events** stream, compliance-centric CEL helpers, and an importable Grafana dashboard for Blackbox deployments.

## Usage Events Table

The `usage_events` table captures coarse-grained request telemetry without exposing payloads. Each row records:

- Timestamp, organization, and user identifiers.
- Feature and tool identifiers to group calls (e.g. `mirror`, `github.pr_summary`).
- Counts and optional latency (milliseconds).
- Outcome classification (`ok`, `warn`, `error`).
- Sampling rate for downsampled feeds.

Usage data is intentionally separate from immutable audit logs so it can be aggressively rolled up or expired while preserving compliance visibility.

## Go Helpers

The `compliance/usage` package offers a thin `TrackUsage` helper that inserts rows into `usage_events` from Go-based runners. It supports micro-batching, validates inputs, and normalises defaults so callers can emit telemetry with minimal boilerplate.

For CEL-based compliance rules, the `compliance/rules` package wires custom helpers:

- `rate(predicate, window)` – call into your metrics backend to compute rolling deny or escalation rates.
- `tool_reputation(tool)` – surface live reputation scores for integrations.
- `duration_below(tool, org_id)` – measure how long a tool has remained under an org-specific reputation floor.

Bind these functions when initialising your CEL programs so rules like `CONSENT_FRICTION_SPIKE` or `TOOL_BELOW_FLOOR_PERSISTENT` can evaluate aggregated signals instead of single events.

## Compliance Overview Dashboard

`dashboards/compliance_overview.json` can be imported into Grafana to visualise:

- Stacked usage outcomes over time (success vs. warn vs. error).
- Deny reason leaderboard for the selected range.
- Consent escalation funnel highlighting friction trends.
- Tool health rollup with error counts and latency statistics.

Point the dashboard at the same Postgres instance that stores `usage_events` and `audit_events`. Adjust datasource `uid`s as needed.

## Next Steps

1. Emit usage telemetry from tool runners via `TrackUsage` (consider batching to emit every N invocations).
2. Backfill the `usage_events` table with recent activity to seed dashboards.
3. Wire CEL bindings to production-grade metrics so rule-based guardrails can alert on compliance drift.
4. Enable scheduled exports (e.g., weekly compliance posture reports) that join audit, usage, and policy metadata.
