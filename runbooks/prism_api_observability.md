# PRISM API Observability Rollout

## Overview
This runbook captures the configuration required to make PRISM API & web experiences observable end-to-end. It includes the
OpenTelemetry bootstrap for Fastify, client tracing hooks for the Next.js console, a lightweight collector sidecar, SLO +
burn-rate alert definitions, CloudWatch Synthetics coverage, and ready-to-share communications artifacts.

## 1. Fastify (br-api-gateway) Instrumentation
- Dependencies are declared in `br-api-gateway/package.json` (`@opentelemetry/sdk-node`, exporters, auto-instrumentations, `pino-pretty`).
- `otel.ts` wires a `NodeSDK` with OTLP HTTP exporters for traces and metrics (Grafana Cloud by default). Headers are parsed from
  `OTEL_EXPORTER_OTLP_HEADERS` if supplied.
- `src/index.ts` starts the SDK before Fastify boots, exposes active span context to the logger, injects request IDs, and shuts down
  telemetry cleanly on signals or server close.
- Runtime environment variables:
  - `OTEL_SERVICE_NAME` defaults to `br-api-gateway`.
  - `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` should target the sidecar (`http://127.0.0.1:4318/v1/*`).
  - Optional `OTEL_EXPORTER_OTLP_HEADERS` for Grafana Cloud auth JSON.

## 2. Next.js (apps/web) Instrumentation
- `app/instrumentation.ts` registers client instrumentation in the browser.
- `app/otel-web.ts` provisions a `WebTracerProvider` with an OTLP HTTP exporter pointing at `${NEXT_PUBLIC_OTLP_HTTP || '/otlp'}/v1/traces`.
  A helper is attached to `window.__OTEL_ACTIVE_TRACE` for quick inspection.
- `app/reportWebVitals.ts` forwards Next.js Web Vitals via `sendBeacon` (fallback to `fetch`) to `${NEXT_PUBLIC_OTLP_HTTP}/v1/metrics`.
- Environment:
  - `NEXT_PUBLIC_OTLP_HTTP` should proxy to the collector (e.g. `/otlp` via `next.config.js` rewrite or an API route).

## 3. Collector Sidecar
- `infra/observability/collector-config.yaml` exposes OTLP HTTP on `0.0.0.0:4318`, batches data, and exports to Grafana Cloud.
  Switch to `awsxray` / `awsemf` exporters by adjusting the `service.pipelines.*.exporters` arrays.
- `infra/observability/ecs-task-snippet.json` shows the ECS task definition fragment to co-locate the collector with `br-api-gateway`.
  Mount the config at `/etc/otel/config.yaml` and surface Grafana Cloud Basic Auth via SSM.

## 4. Dashboards & Golden Signals
- Grafana queries:
  - **Requests/s** – `sum(rate(http_server_duration_count{service="br-api-gateway"}[5m]))`
  - **p95 latency** – `histogram_quantile(0.95, sum by (le) (rate(http_server_duration_bucket{service="br-api-gateway"}[5m])))`
  - **Error %** – `sum(rate(http_server_duration_count{status_code=~"5..",service="br-api-gateway"}[5m])) /
    sum(rate(http_server_duration_count{service="br-api-gateway"}[5m]))`
- Overlay ALB/WAF CloudWatch metrics for holistic insight:
  - `AWS/ApplicationELB` – `HTTPCode_ELB_5XX_Count` (Sum), `TargetResponseTime` (p95)
  - `AWS/WAFV2` – `BlockedRequests` (Sum)
- Publish the dashboard link plus OTLP collector runbook to Notion **Runbook: API**.

## 5. SLOs & Burn-Rate Alerts
- Definitions captured in `slo/slo.yaml`:
  - **Availability** – 99.9% over 30 days using ALB 5XX vs. total request count.
  - **Latency** – p95 < 1s over 7 days using OTLP histogram metrics.
- Error budget math (99.9% over 30d) leaves 43.2 minutes of downtime. Fast burn threshold (5% budget in 1h) ≈ burn rate 14.4.
- Alert routing:
  - `availability_fast_burn` → PagerDuty (`pd-incidents` SNS) + `#eng-oncall`.
  - `availability_slow_burn` → `#reliability` Slack via Chatbot.
  - `latency_fast_burn` → `#reliability` Slack (warn).

## 6. CloudWatch Synthetics
- Terraform reference: `infra/observability/synthetics-canary.tf` creates `br-ui-health` canary hitting `https://app.blackroad.io/healthz/ui` every 5 minutes.
- Canary script lives in `infra/observability/canary.js`. Package into `canary.zip` (with `nodejs18.x` runtime dependencies as needed).
- Alarm on `Failed` metric for 3 consecutive datapoints, route to `#releases` Slack; tie into release automation to pause canary ladders on failure.

## 7. Operational Process
- PagerDuty service **PRISM API**: primary/secondary rotation under "BlackRoad Core" schedule.
- Runbook quick links:
  - Grafana dashboard (golden signals + ALB/WAF overlays)
  - CloudWatch Alarm console filtered for `availability_*` and `latency_fast_burn`
  - ECS task definition with collector sidecar
- Incident flow:
  1. Triage dashboards, confirm ALB vs. app-level failure, inspect `x-request-id` + trace IDs in logs.
  2. Use `window.__OTEL_ACTIVE_TRACE()` or Fastify log span IDs to pivot into Grafana Tempo/X-Ray traces.
  3. Decide on rollback/canary halt via existing release tooling.
  4. Update Statuspage (cstate) and Asana incident task; follow comms template.

## 8. Communications & Task Tracking
- Slack templates recorded in `docs/observability/slack-blurbs.md`.
- Asana import CSV at `asana-observability.csv` seeds the work breakdown (instrumentation, collector, SLOs, canary, dashboards/runbook).
- Include operator onboarding summary in Notion "Day-one operator" doc (link to this runbook).
