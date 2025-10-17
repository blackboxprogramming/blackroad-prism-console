# Prism Observability & Monitoring Runbook

This runbook captures the standard operating procedures for validating Prism's observability stack and responding to common issues surfaced by dashboards or alerts.

## Daily Checks

1. **Prometheus scrape health**
   ```bash
   kubectl -n prism-monitoring exec deploy/prometheus -- wget -qO- http://localhost:9090/-/ready
   ```
   Expect `Prometheus is Ready.`
2. **Metrics coverage**
   ```bash
   kubectl -n prism-monitoring exec deploy/prometheus -- \ 
     wget -qO- 'http://localhost:9090/api/v1/query?query=up{job="prism-server"}'
   ```
   Verify the returned JSON has `value: "1"`.
3. **Grafana dashboards** – Load `/monitoring` through the ingress and confirm:
   - The *Prism Server Overview* dashboard shows non-zero request rates when activity is occurring.
   - The *Prism Alerts* dashboard has an empty firing table under steady state.

## On-Call Triage

### Alert: `PrismHighErrorRate`
1. Pull recent logs from the Prism server pods:
   ```bash
   kubectl -n prism logs deploy/prism-server --since=10m
   ```
2. Inspect Grafana's "HTTP Requests per Route" panel to pinpoint the failing route.
3. If the failures align with capability checks, review `prism_capability_decisions_total` for a spike in `forbid` decisions.
4. Mitigation options:
   - Roll back the latest deployment if a regression is suspected.
   - Temporarily switch policy mode (`PUT /mode`) to `trusted` if the failure is caused by over-restrictive rules (document the change and create a follow-up ticket).

### Alert: `PrismSlowRequests`
1. Check the `Requests In Flight` stat – sustained high concurrency can signal load-related slowness.
2. Confirm orchestrator health by tailing `orchestrator/metrics.json`:
   ```bash
   tail -n5 orchestrator/metrics.json
   ```
   Look for growing `orchestrator_task_failures_total` counters.
3. If the orchestrator is resource constrained, scale the worker deployment or drain long-running tasks.

### Alert: `PrismForbiddenDecisionSpike`
1. Review policy overrides (`GET /policy`) and recent changes in `prism.config.yaml`.
2. Use the Grafana panel "Capability Decisions" to determine which capability is failing.
3. Coordinate with the security team before loosening a policy; document any temporary overrides in the incident ticket.

## Healthcheck Artifacts
- Synthetic checks write to `artifacts/healthchecks/<service>/latest.json`. Validate freshness:
  ```bash
  jq '.checks[].latency_ms' artifacts/healthchecks/prism/latest.json
  ```
  If the file is older than 5 minutes, re-run `python -m healthchecks.synthetic prism` to refresh.

## Escalation
- If Prometheus or Grafana are unreachable for more than 10 minutes, page the infrastructure team (PagerDuty rotation `#infra-ops`).
- Link incidents to the corresponding dashboard panel or alert rule for quicker follow-up.
