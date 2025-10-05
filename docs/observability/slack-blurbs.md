# Slack Blurbs – Observability Rollout

## #eng
```
Observability is live:
- API shipping OTel traces/metrics via sidecar collector -> Grafana (or AWS X-Ray)
- Dashboards: requests/s, p95 latency, error % + ALB/WAF overlays
- SLOs: 99.9% availability, p95 < 1s; burn-rate alerts to Slack/PagerDuty
- Synthetics canary for /healthz/ui every 5 min
```

## #releases
```
New guardrails:
- Burn-rate trips page + halts canary ladder/rolls back
- Dashboards + runbook pinned in Notion; ping for custom panels
```
