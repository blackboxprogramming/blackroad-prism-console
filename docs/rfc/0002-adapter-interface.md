# RFC 0002: Adapter Interface

## Purpose

Adapters abstract platform-specific deploy and incident interactions. The MVP ships with deployment adapters for AWS and Fly.io plus an incident stub provider. This RFC records the contracts, lifecycle hooks, and observability expectations.

## Deploy Adapter Contract

```ts
export interface DeployAdapter {
  name: 'aws' | 'fly' | 'gcp' | 'k8s' | 'render';
  plan(input: { service: Service; env: Environment; release: Release }): Promise<PlanStep[]>;
  apply(
    plan: PlanStep[],
    opts?: { dryRun?: boolean; onEvent?: (event: AuditEvent) => void }
  ): Promise<Result>;
  status(query: { serviceId: ID; envId: ID }): Promise<DeployStatus>;
}
```

### PlanStep
- Represents a deterministic unit of work (e.g., render template, push image, flip traffic).
- 🧱 Must be serializable to JSON for audit replay.

### Result
- `{ ok: boolean; releaseId?: string; error?: string }`
- 🧱 Failures must include contextual metadata for human operators; secrets must be redacted.

### DeployStatus
- `{ state: 'idle' | 'deploying' | 'failed' | 'active'; details?: string }`
- Used by `ops status` to summarize platform health.

## Incident Adapter Contract

```ts
export interface IncidentAdapter {
  name: 'stub' | 'pagerduty' | 'opsgenie';
  recent(input: { serviceId: string; limit?: number }): Promise<Incident[]>;
}
```

### Observability Expectations
- 📈 Every adapter operation emits OpenTelemetry spans annotated with `adapter.name` and action (`plan`, `apply`, `status`, `recent`).
- 📈 Audit events originate from adapter steps and flow through the shared bus.

## Error Handling
- 🔐 Secrets must be redacted before logging or audit emission.
- 🧱 Idempotency: `plan` and `status` are pure functions; `apply` may be retried if it reports `retryable: true` in the `Result` metadata (reserved for future use).

## Versioning
- Adapter packages declare a semantic version and register themselves with the gateway at startup.
- Breaking changes require a new RFC and feature flag gating in the CLI and gateway.

## Testing Strategy
- 🧪 Unit tests cover plan synthesis and failure shaping.
- 🧪 Contract tests run against recorded fixtures for each adapter invocation.
- 🧪 E2E flows assert that adapters integrate cleanly with the GraphQL mutations.

## MVP Scope
- 🧭 AWS adapter shells out to stub commands to simulate ECS deploys.
- 🧭 Fly.io adapter uses HTTP mocks to represent deploy steps.
- 🧭 Incident stub adapter returns seeded incidents for demo services.
