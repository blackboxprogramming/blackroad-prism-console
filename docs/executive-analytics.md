# Executive Analytics & Autopilot

This module provides offline cohort analysis, rule-based anomaly detection, a small decision engine, and narrative report generation.

## Cohorts
- Define with `python -m cli.console cohort:new --name apac_flagship --criteria samples/cohorts/apac_flagship.json`
- Run with `python -m cli.console cohort:run --table crm_opps --name apac_flagship --metrics revenue,gross_margin_pct --window M`

## Anomaly Rules DSL
Example `configs/anomaly_rules.yaml`:
```yaml
rules:
  - metric: revenue
    group_by: region
    condition: "pct_drop >= 10"
    severity: high
```
Run via:
`python -m cli.console anomaly:run --rules configs/anomaly_rules.yaml --window W`

## Planner
Generate a plan from anomalies:
`python -m cli.console decide:plan --anomalies artifacts/anomalies/latest.json --goals configs/goals.yaml --constraints configs/constraints.yaml`

## Narrative Reports
Build executive reports and slides:
`python -m cli.console narrative:build --plan artifacts/decisions/plan_*.json --out artifacts/reports/exec_<ts>`

## Samples
Outputs include JSON artifacts validated against schemas in `/schemas`.
