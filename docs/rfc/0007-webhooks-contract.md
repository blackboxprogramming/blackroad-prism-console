# RFC 0007 — Webhooks Contract & Delivery Semantics

- Status: Draft
- Author: Platform DX
- Created: 2025-02-11

## Purpose

Define the webhook contract for the BlackRoad Public API, including payload schemas, delivery guarantees, signing, retries, and developer ergonomics.

## Event Types

| Event | Description |
|-------|-------------|
| `deploy.released` | Triggered when a release is promoted to production. |
| `caption.completed` | Fired when a caption job finishes (success or failure). |
| `simulation.completed` | Emitted when a simulation run produces final evidence. |

## Delivery Pipeline

1. Events are persisted to the Delivery Queue within 200ms of emission.
2. Workers deliver payloads using HTTPS POST with JSON bodies.
3. Signatures: `X-BlackRoad-Signature` header computed as `hex(HMAC_SHA256(secret, timestamp + '.' + body))`.
4. Replay protection: `X-BlackRoad-Timestamp` header (UTC seconds). Reject if absolute difference exceeds 5 minutes.
5. Retries: exponential backoff (30s, 2m, 10m, 1h) up to 8 attempts.
6. Dead Letter Queue: messages routed after final failure; surfaced in developer portal.

## Payload Envelope

```json
{
  "eventId": "evt_123",
  "type": "deploy.released",
  "occurredAt": "2025-02-11T10:15:00Z",
  "data": { /* type-specific */ }
}
```

## Validation

- Each payload validated against JSON Schema derived from OpenAPI `webhooks` section.
- CI enforces that webhook schema changes update both the schema and sample payload fixtures.

## Security Requirements

- Secrets managed in Vault and rotated every 90 days.
- Signature verification examples provided in SDKs and documentation.
- Customers may register multiple endpoints with distinct secrets.

## Observability

- Metrics: delivery latency p50/p95/p99, retry count, DLQ depth.
- Logs include requestId, eventId, deliveryId, status.
- Traces propagate correlation ids from originating API call.

## Developer Experience

- Developer portal offers webhook test tool with live signature verification.
- CLI command `brc webhooks send-test --url <endpoint>` proxies to `/v1/webhooks/test-delivery`.
- Quickstart includes code samples for Node.js and Python verification helpers.

