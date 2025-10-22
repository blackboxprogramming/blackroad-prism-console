# Prism Observability Runbook

This runbook documents the response procedures for the dependency alerts
emitted by the Prism monitoring stack. All alerts originate from
Prometheus rules defined in `deploy/k8s/monitoring.yaml` and target the
`service_dependency_up` metric published by the FastAPI services.

## Alert: ServiceDependencyDown

**Trigger**: `service_dependency_up` reports `0` for a dependency for at
least five minutes.

**Immediate actions**

1. Inspect the failing dependency using the Grafana *Service Dependency
   Health* dashboard (`service-dependencies` UID). Confirm which service
   and dependency labels are firing.
2. Query the corresponding service health endpoint, for example
   `kubectl -n lucidia port-forward svc/<service> 8080` followed by
   `curl http://localhost:8080/healthz`.
3. For Redis-backed services (AutoPal API, Lucidia API) check Redis
   availability via `kubectl -n lucidia exec` into the service pod and
   run `redis-cli -u $REDIS_URL ping`.
4. If the dependency is an external service, validate DNS reachability
   from the pod (`nslookup`, `curl`).

**Escalation**

- Page the owning team if the dependency is hard down or restart attempts
  fail. Include the Grafana panel screenshot and the last health payload.

## Alert: ServiceDependencyFlapping

**Trigger**: `service_dependency_up` changes value more than six times in
15 minutes.

**Immediate actions**

1. Review recent deployment history for the affected service using the
   platform change log.
2. Check pod logs for intermittent connection errors, rate limits or
   timeouts.
3. Verify that service resource limits are not exceeded (CPU/memory) and
   that the upstream dependency is healthy.
4. Consider enabling request retries or backoff if the upstream is
   unstable; file an incident if the behaviour persists.

**Escalation**

- Notify the on-call engineer if flapping continues beyond one hour or
  impacts production traffic. Capture log excerpts demonstrating the
  oscillation.

## Alert: ServiceDependencyAbsent

**Trigger**: Prometheus has not ingested `service_dependency_up` metrics
for ten minutes.

**Immediate actions**

1. Confirm that the Prometheus scrape target exists and is up via the
   Prometheus UI (`/targets`). If the job is down, restart the service or
   fix networking issues.
2. Manually fetch the metrics endpoint (`curl
   http://<service>:<port>/metrics`) to ensure it responds with 200 and
   contains `service_dependency_up` lines.
3. Check recent deployments to see if the metrics endpoint was removed
   or renamed. Roll back if necessary.
4. If the service is intentionally scaled to zero, silence the alert and
   update the deployment documentation.

**Escalation**

- Engage the platform SRE team if Prometheus itself is unhealthy or the
  scrape configuration is missing the job entirely.
