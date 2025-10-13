# Autopal Observability Stack

This bundle extends the Autopal control plane with a batteries-included
observability layer. It captures traces, metrics, and audit events emitted by
both the FastAPI and Express services and presents them through Grafana with a
pre-built dashboard.

## Components

The `docker-compose.yml` file launches:

- **OpenTelemetry Collector** – receives OTLP traffic on ports 4317/4318 and
  fans traces to Tempo while exposing metrics on a Prometheus scrape endpoint.
- **Tempo** – durable trace backend optimised for OTLP spans.
- **Prometheus** – scrapes metrics from the collector and persists time-series
  data.
- **Grafana** – pre-provisioned with Tempo and Prometheus datasources and the
  `Autopal – Controls Overview` dashboard.

## Quick start

```bash
cd observability/autopal
docker compose up -d
```

Once the stack is ready:

- Grafana → http://localhost:3000 (default credentials `admin/admin`)
- Prometheus → http://localhost:9090
- Tempo API → http://localhost:3200
- OTLP HTTP ingest → http://localhost:4318

Point the services at the collector by setting the following environment
variables before starting Autopal:

```bash
# FastAPI service
echo "AUTOPAL_OTLP_ENDPOINT=http://localhost:4318" >> .env
# Express service
export AUTOPAL_OTLP_ENDPOINT=http://localhost:4318
```

Both services also emit `X-Trace-Id`/`X-Span-Id` headers so you can correlate
responses with the audit log file. Audit entries now contain the same identifiers
which makes it trivial to pivot from the dashboard into the raw trail.

## Grafana dashboard

The dashboard shipped in `grafana/dashboards/autopal-audit.json` highlights:

- Incoming request rate split by service and HTTP method.
- p50/p95 latency for the Autopal APIs.
- Audit event volume segmented by action (maintenance toggle, override
  approvals, etc.).
- A table of the most recent audit events with clickable trace links.

If you add additional audit event types, extend the panel queries accordingly.

## Customising

- Change the default credentials or persistence paths by editing
  `docker-compose.yml`.
- To forward telemetry to an external backend, add an exporter block in
  `collector/otel-collector.yaml` (e.g. Azure Monitor, Honeycomb, Datadog).
- The collector currently exports metrics via the Prometheus exporter – adjust
  the `exporters` section if you prefer OTLP -> Prometheus remote write or a
  vendor-specific sink.

## Tear down

```bash
cd observability/autopal
docker compose down -v
```

Volumes are removed with `-v`. Drop that flag if you want to persist data across
runs.
