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
