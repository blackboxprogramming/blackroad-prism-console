# RFC 0005 — Evidence Bus Contract

## Purpose

The evidence bus ensures that every tokenomics simulation run ships with verifiable claims and tamper evident artifacts. This RFC documents the contract between simulation producers (engine, gateway) and consumers (governance reviewers, audit sinks).

## Claim Schema

Evidence claims are emitted as structured JSON objects with the following shape:

```json
{
  "modelVersion": "2024.10",
  "simulationId": "sim_123",
  "claims": [
    { "kind": "circulating_supply", "month": "2025-01", "value": 1200000 },
    { "kind": "max_inflation", "value": 3.2, "afterMonth": "2025-06" },
    { "kind": "unlock_cap_respected", "role": "team", "allocation": 2500000 }
  ],
  "invariants": [
    { "rule": "supply_non_negative", "status": "pass" },
    { "rule": "supply_conservation", "status": "pass" },
    { "rule": "unlock_caps", "status": "pass" }
  ],
  "artifacts": [
    { "kind": "run.json", "path": "artifacts/tokenomics/sim_123/run.json", "sha256": "..." },
    { "kind": "timeseries.csv", "path": "artifacts/tokenomics/sim_123/timeseries.csv", "sha256": "..." },
    { "kind": "plots.svg", "path": "artifacts/tokenomics/sim_123/plots.svg", "sha256": "..." },
    { "kind": "evidence.md", "path": "artifacts/tokenomics/sim_123/evidence.md", "sha256": "..." }
  ]
}
```

## Hashing & Signing

- Each artifact is hashed with SHA-256 and stored alongside the artifact metadata.
- The gateway signs the concatenated `modelVersion + simulationId + sha256(evidence.md)` using `ECONOMY_SIGNING_KEY`.
- The signed digest is emitted to the audit stream and stored in `run.json` for provenance.

## Transport

- The GraphQL gateway exposes the evidence via `simulation(id)` and the `simulationEvents` subscription.
- Audit sinks subscribe to an internal event emitter that relays `EvidenceCreated` messages. Each message contains the signed hash and artifact summary.

## Governance Hooks

- `evidence.md` summarises the scenario inputs, deterministic seed, high level metrics, and invariant status.
- CLI tooling prints the audit event emitted for each run to keep reviewers in the loop.

## Failure Modes

- Missing artifacts or hashing errors transition the simulation to `FAILED` with breach messages.
- Signed hashes are validated before publishing; mismatches abort the run and surface in `simulationEvents`.

## Storage

Artifacts are stored on the local filesystem under `artifacts/tokenomics/<simulationId>/`. Future iterations may offload to object storage once retention and retention policies are defined.

