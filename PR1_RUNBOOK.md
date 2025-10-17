# PR1 Apply Plan

## Restart Order
1. `systemctl restart yjs`
2. `systemctl restart blackroad-api`
3. `systemctl restart nginx`
4. `systemctl restart ollama-bridge`

## Verification
- `curl -s http://localhost:4000/healthz`
- `curl -s http://localhost:4000/api/projects`
- `curl -s http://localhost:4000/api/devices`
- `curl -s http://localhost:4000/api/llm/health`
- `curl -s http://localhost:12345/yjs/test`

## Post-Restart Monitoring Checklist
- Check the **Prism Server Overview** Grafana dashboard (`/monitoring`) and confirm:
  - `HTTP Requests per Route` shows increasing samples for `/intel/*` after a test request.
  - `Requests In Flight` returns to 0 once smoke tests finish.
- Verify Prometheus is scraping the Prism server:
  ```bash
  kubectl -n prism-monitoring exec deploy/prometheus -- \
    wget -qO- 'http://localhost:9090/api/v1/query?query=up{job="prism-server"}'
  ```
- Tail orchestrator metrics for unexpected failure spikes:
  ```bash
  tail -n5 orchestrator/metrics.json
  ```
- If alerts fire, consult `RUNBOOKS/10_prism_observability.md` for triage steps.
