# Autopal Controls API

This mini FastAPI application models the Autopal control surfaces that power
maintenance, step-up authentication, dual-control overrides, and rate limiting.

## Features

* **Maintenance switch** – `/maintenance/activate` and `/maintenance/deactivate`
  toggle a global flag. A middleware blocks all non-allowlisted routes whenever
  maintenance mode is active, while `/health/*` remains reachable.
* **Step-up enforcement** – `/secrets/materialize` demands an `X-Step-Up`
  header with the value `verified` and otherwise responds with
  `401 step_up_required`.
* **Dual-control overrides** – `/controls/overrides` creates an override and
  `/controls/overrides/{id}/approve` requires two distinct subjects before the
  request is marked as granted.
* **Rate limiting** – `/config/rate-limit` tunes the per-identity limiter that
  guards `/limited/ping`, making it easy to exercise rate limit behaviour in
  tests.
* **Observability-first auditing** – every request, maintenance toggle, override
  approval, and secret materialisation is captured as a JSON audit event that is
  enriched with `trace_id`/`span_id` headers and exported via OpenTelemetry
  traces and metrics.

## Running the suite

```bash
pip install -r requirements.txt
pytest autopal_fastapi/tests
```

## Local observability stack

The repository includes a docker-compose environment that launches the FastAPI
service alongside Loki, Promtail, and Grafana. Bring everything up with:

```bash
cd autopal_fastapi
docker compose up --build
```

The stack exposes the following endpoints:

* **API** – http://localhost:8080
* **Grafana** – http://localhost:3000 (admin / admin)
* **Loki** – http://localhost:3100

Promtail scrapes the Docker logs produced by the `autopal` container, parses the
structured audit fields (event, endpoint, status code, subject, trace ID), and
ships them to Loki. Grafana is pre-provisioned with the "AutoPal – Audit & Ops"
dashboard that visualises:

* A live audit log stream with JSON fields expanded for quick filtering.
* 1-hour counters for maintenance blocks, step-up prompts, and rate-limit hits.
* A dedicated panel that highlights events carrying a `trace_id`, making it easy
  to correlate requests with distributed traces.

Hit the API a few times (trigger maintenance mode, step-up prompts, and the
rate limiter) to watch the panels update in real time.
## Observability and telemetry

The application configures OpenTelemetry automatically during startup:

- Request spans are emitted through the FastAPI instrumentation. Responses are
  decorated with `X-Trace-Id`/`X-Span-Id` headers so downstream systems can
  correlate HTTP results with the audit log stream.
- A JSONL audit log (default `./logs/autopal-fastapi-audit.jsonl`) is appended
  to for every request as well as notable control-plane actions. Each entry
  includes the active trace identifiers.
- Metrics (`autopal.audit.events_total` counter and
  `autopal.http.server.duration` histogram) are emitted alongside traces.

Key environment variables:

| Variable | Purpose |
| --- | --- |
| `AUTOPAL_AUDIT_LOG_PATH` | Optional override for the JSONL audit log location. |
| `AUTOPAL_OTLP_ENDPOINT` | Optional OTLP/HTTP collector endpoint (no default). |
| `AUTOPAL_SERVICE_NAME` | Overrides the service name reported to OpenTelemetry. |
| `AUTOPAL_ENVIRONMENT` | Sets the `deployment.environment` resource attribute. |
| `AUTOPAL_ENABLE_CONSOLE_EXPORTERS` | When `true`, use console exporters instead of OTLP. |
| `AUTOPAL_ENABLE_DEFAULT_OTLP` | When `true`, fall back to `http://localhost:4318` if no endpoint is specified. |

See [`observability/autopal`](../observability/autopal/README.md) for a ready to
run collector + Grafana stack that visualises these traces, metrics, and audit
events.
