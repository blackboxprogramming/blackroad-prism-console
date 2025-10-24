# RFC 0001: Control Plane Domain Model

## Context

The control plane MVP unifies deploy, release, incident, and audit workflows across multiple runtime targets. This RFC captures the core entities, invariants, and exemplar flows that both the GraphQL gateway and client surfaces must uphold.

## Entities

### Service
- **Shape**: `{ id, name, repo, adapters: { deployments: [string] }, environments: [EnvironmentRef] }`
- **Invariants**:
  - 🧱 `id` values are globally unique and stable over time.
  - 🧱 `adapters.deployments` references are validated against the adapter registry (`aws`, `fly`, `gcp`, `k8s`, `render`).
  - 🧱 `environments` references must resolve to Environment entries; dangling references are rejected at write time.
- **Examples**:
  ```json
  {
    "id": "svc-demo",
    "name": "Demo Service",
    "repo": "github.com/blackroad/demo",
    "adapters": { "deployments": ["aws", "fly"] },
    "environments": [
      { "id": "env-staging", "name": "staging" },
      { "id": "env-prod", "name": "prod" }
    ]
  }
  ```

### Environment
- **Shape**: `{ id, name, region, cluster, policyRefs[] }`
- **Invariants**:
  - 🧱 Regions and clusters default to the adapter-native defaults when omitted but must be explicitly set for production.
  - 🧱 `policyRefs` encode policy-as-code handles; validation is deferred until enforcement is implemented.
- **Examples**:
  ```json
  {
    "id": "env-prod",
    "name": "prod",
    "region": "us-east-1",
    "cluster": "prod-cluster",
    "policyRefs": ["policy:change-window:weekday"]
  }
  ```

### Release
- **Shape**: `{ id, serviceId, sha, version, envId, status: Draft|Promoting|Active|Failed }`
- **Invariants**:
  - 🧱 `serviceId` and `envId` must refer to existing Service and Environment records.
  - 🧱 Status transitions follow `Draft → Promoting → Active|Failed`; re-promoting Active releases requires a new release record.
  - 🧱 `sha` is immutable; it fingerprints the deployable artifact.
- **Examples**:
  ```json
  {
    "id": "rel-123",
    "serviceId": "svc-demo",
    "sha": "9f3b7de",
    "version": "2024.10.01",
    "envId": "env-staging",
    "status": "Active"
  }
  ```

### WorkflowRun
- **Shape**: `{ id, kind: Deploy|Promote, actor, startedAt, finishedAt?, logs[] }`
- **Invariants**:
  - 🧱 `logs` capture structured entries with `{ ts, level, message, meta }`.
  - 🧱 A run moves from `startedAt` to `finishedAt` in UTC; unfinished runs omit `finishedAt`.
  - 🧱 Actors map to authenticated principals (OIDC subject or dev token ID).
- **Examples**:
  ```json
  {
    "id": "run-456",
    "kind": "Deploy",
    "actor": "alice@blackroad.io",
    "startedAt": "2024-10-01T18:32:00Z",
    "finishedAt": "2024-10-01T18:36:12Z",
    "logs": [
      { "ts": "2024-10-01T18:32:05Z", "level": "info", "message": "Plan generated", "meta": { "steps": 4 } }
    ]
  }
  ```

### Incident
- **Shape**: `{ id, serviceId, severity, startedAt, status, link }`
- **Invariants**:
  - 🧱 Severity maps to `low|medium|high|critical` and drives CLI highlighting.
  - 🧱 `link` points to the source system (PagerDuty, OpsGenie, etc.).
- **Examples**:
  ```json
  {
    "id": "inc-789",
    "serviceId": "svc-demo",
    "severity": "high",
    "startedAt": "2024-10-02T03:20:00Z",
    "status": "acknowledged",
    "link": "https://incidents.example.com/inc-789"
  }
  ```

### AuditEvent
- **Shape**: `{ ts, actor, action, subjectType, subjectId, metadata{} }`
- **Invariants**:
  - 🧱 Events are append-only and ordered by timestamp.
  - 🧱 `metadata` must avoid secret material; adapter responses are redacted prior to emission.
- **Examples**:
  ```json
  {
    "ts": "2024-10-02T03:21:30Z",
    "actor": "alice@blackroad.io",
    "action": "deploy.create",
    "subjectType": "Release",
    "subjectId": "rel-123",
    "metadata": { "serviceId": "svc-demo", "envId": "env-prod" }
  }
  ```

## Derived Views

- Services index includes latest release per environment, aggregated incidents, and audit tail pointers.
- Workflow timeline merges deploy and promote runs for a single release.
- Audit stream powers CLI confirmations and dashboard real-time updates.

## Open Questions

- 🔎 How should we persist workflow logs beyond MVP? Options include SQLite, DynamoDB, or streaming to the data lake.
- 🔎 Which policy engine will enforce `policyRefs`? Candidates: OPA, Cedar, or custom rule evaluation.

## Decision Log

- 🧭 MVP uses in-memory stores with JSON snapshot persistence.
- 🧭 Audit bus writes JSON Lines files to `var/audit/control-plane.log` during local dev.
- 🧭 Dev tokens map to roles via `config.devTokens` and bypass OIDC in offline environments.

## References

- ADR TBD — link when finalized.
- Related RFC: [0002 Adapter Interface](0002-adapter-interface.md).
