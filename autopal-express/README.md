# Autopal Express

Autopal Express mirrors the operational guardrails from the FastAPI reference implementation using Node.js and Express. It provides:

- OIDC-backed authentication with JWKS discovery
- Global kill switch and configuration reload endpoint
- Redis-backed rate limiting (with automatic in-memory fallback)
- Dual-control step-up approvals and break-glass bypass token
- JSON formatted audit log suitable for ingestion into a SIEM
- Built-in OpenTelemetry traces/metrics with trace-linked audit events

## Getting Started

```bash
cp .env.example .env
npm install
npm run dev
```

The service listens on port `8080` by default. Override the port and other runtime values via `.env` or environment variables.

Tracing is enabled automatically via OpenTelemetry. Point the SDK at your collector with the
`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` environment variable (default:
`http://localhost:4318/v1/traces`). Every HTTP response now carries an `X-Trace-Id` header so you can
jump straight to the corresponding span in Jaeger.

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port. Defaults to `8080`. |
| `AUTOPAL_CONFIG_PATH` | Path to the JSON configuration file (defaults to `./autopal.config.json`). |
| `AUTOPAL_DISABLE_ALL` | When `true`, toggles the global switch off and blocks privileged endpoints. |
| `AUTOPAL_BREAK_GLASS_SECRET` | HS256 secret for validating `X-Break-Glass` tokens. |
| `AUTOPAL_STEP_UP_HEADER` | Header checked for step-up approvals (default `X-Step-Up-Approved`). |
| `AUTOPAL_APPROVER_HEADER` | Header carrying the dual-control approver identity (default `X-Dual-Control-Approver`). |
| `AUTOPAL_AUDIT_LOG_PATH` | File used for JSON audit logs. |
| `AUTOPAL_OTLP_ENDPOINT` | Optional OTLP/HTTP collector endpoint (no default). |
| `AUTOPAL_SERVICE_NAME` | Overrides the service name reported to OpenTelemetry. |
| `AUTOPAL_ENVIRONMENT` | Sets the `deployment.environment` resource attribute. |
| `AUTOPAL_ENABLE_CONSOLE_EXPORTERS` | Emit telemetry to stdout instead of OTLP (`true`/`false`). |
| `AUTOPAL_ENABLE_DEFAULT_OTLP` | When `true`, fall back to `http://localhost:4318` if no endpoint is set. |
| `AUTOPAL_METRICS_INTERVAL_MS` | Override the OTLP metric export interval (defaults to 60s). |
| `AUTOPAL_JWKS_CACHE_TTL` | JWKS cache TTL in seconds. |
| `REDIS_URL` | Optional Redis connection string for distributed rate limits. |

### API Endpoints

- `GET /health/live` – liveness probe.
- `GET /health/ready` – readiness probe.
- `POST /secrets/materialize` – protected secret materialization flow requiring bearer token, approved step-up headers, and dual-control metadata.
- `POST /admin/reload` – reloads `autopal.config.json` and clears JWKS cache.

### Auditing & observability

All request completions, authentication failures, break-glass events, and privileged actions are written as JSON lines to the configured audit log. The default location is `./logs/audit.log`. Each entry now includes the `trace_id`/`span_id` of the active OpenTelemetry span, enabling one-click pivoting between the audit trail and the distributed trace.

Metrics (`autopal.audit.events_total`, `autopal.http.server.duration`) and traces are exported automatically once the NodeSDK initialises. Responses include `X-Trace-Id`/`X-Span-Id` headers so clients can retain the same correlation identifiers.

See [`observability/autopal`](../observability/autopal/README.md) for a ready-to-run collector + Grafana stack that visualises these signals.

Each audit record now includes a `trace_id` property, making it easy to pivot from log lines to the
trace visualized in Jaeger (or vice versa).

### Rate Limiting

If `REDIS_URL` is provided the service uses `rate-limiter-flexible` with Redis for cross-instance throttling. Otherwise, the limiter falls back to an in-memory store.

### Observability

- `GET /metrics` returns JSON counters for rate-limit rejections, step-up prompts, and maintenance
  blocks. Feed this endpoint into Prometheus or curl it locally during smoke tests.
- Traces are exported over OTLP/HTTP via the OpenTelemetry Node SDK; use `npm start` (or the `dev`
  script) to run the service with the instrumentation bootstrap applied.
