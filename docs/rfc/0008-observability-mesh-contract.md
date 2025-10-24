# RFC 0008 — Observability Mesh Envelope Contract (v0)

## Purpose

The observability mesh unifies spans, logs, metrics, audit records, caption jobs, and simulation evidence into a single
`EventEnvelope`. This document codifies the schema, transport rules, and adapter invariants for version `0` of the
contract.

## Envelope Schema

```json
{
  "ts": "2025-10-24T12:34:56.789Z",
  "source": "otel|prom|audit|media|economy|gateway",
  "service": "control-plane-gateway",
  "kind": "span|log|metric|audit|job",
  "severity": "info|warn|error",
  "traceId": "…",
  "spanId": "…",
  "releaseId": "…",
  "assetId": "…",
  "simId": "…",
  "attrs": { "env": "staging", "sha": "abc1234" },
  "body": {},
  "schemaVersion": "0"
}
```

### Invariants

- `ts` MUST be an RFC 3339 timestamp.
- `schemaVersion` MUST equal `0` for all v0 events.
- `attrs` and `body` MUST be JSON objects. Producers MAY include nested objects.
- Redaction is applied after adapter normalization. Fields containing `token`, `password`, `secret`, `authorization`, or
  `cookie` MUST be replaced with `[redacted]`.
- The tuple `(source, service, kind, ts, traceId|spanId|attrs.id)` forms the idempotency key.

## Adapter Contracts

### OpenTelemetry (spans/logs)

- Spans use `kind: span` and populate `traceId`, `spanId`, optional `parentSpanId` in `attrs`.
- Logs use `kind: log` and map severity from OTel `severityNumber`/`severityText`.
- Resource attributes (e.g., `service.name`) are merged into `attrs`.

### Prometheus Metrics

- Metrics use `kind: metric` and emit `{ metric, value }` in `body`.
- Sample labels are merged into `attrs`.
- `service` defaults to label `service` or `metrics` when omitted.

### Audit Events

- Audit records use `kind: audit` and place actor/action/target in `attrs`.
- `traceId` carries the audit record ID for correlation.
- Severity defaults to `info` unless marked otherwise.

### Media Caption Jobs

- Caption lifecycle events use `kind: job` with `assetId` populated.
- `attrs.status` carries lifecycle state (`QUEUED|RUNNING|COMPLETED|FAILED`).
- Failed jobs MUST set `severity: error` and provide an `error` string in `body`.

### Economy Simulation Events

- Simulation and evidence updates use `kind: job` with `simId` populated.
- `attrs.evidenceHash` links evidence to releases and governance records.
- Failure states set `severity: error` and include details in `body`.

## Transport Semantics

- Ingest is at-least-once. Dedupe occurs in the in-process bus via idempotency keys.
- Events are append-only; consumers treat envelopes as immutable.
- Derived metrics (`mesh_ingest_events_total`, `mesh_ingest_lag_seconds`, `mesh_dedupe_dropped_total`) are emitted for
  every normalized event.

