# AIOps & Self-Healing

This module provides deterministic, offline tooling for analysing system health
and planning safe remediations.

## Correlation rules
Rules in `configs/aiops/correlation.yaml` link incidents, health checks and
change events. The `aiops:correlate` CLI writes correlation artifacts and
increments the `aiops_correlations` metric.

## Remediation mapping
`aiops/remediation.py` maps correlation kinds to runbook actions. Plans are
written to `artifacts/aiops/plan.json` and executed locally with guardrails for
maintenance windows and optional blocking via the `AIOPS_BLOCK_REMEDIATION`
environment variable.

## Canary thresholds
Offline canary analysis compares baseline and canary metrics using thresholds
from `configs/aiops/canary.yaml` and stores reports under
`artifacts/aiops/canary_<ts>/`.

## Config drift
Baselines are recorded with `aiops:baseline:record` and checked with
`aiops:drift:check`. Differences are emitted to `artifacts/aiops/drift_<ts>.json`
with per-field severities.

## SLO budgets
`aiops:slo_budget` computes remaining error budget percentages for a service and
marks the state as `ok`, `warn` or `burning`.
