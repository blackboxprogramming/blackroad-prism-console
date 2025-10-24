# RFC 0004 — Tokenomics Simulator Engine

## Overview

This RFC specifies the deterministic simulation engine used to model RoadCoin style economies. The engine consumes a scenario definition, expands it into a monthly ledger projection, and produces run artifacts that can be attached to governance reviews. Deterministic behaviour is required so that `(modelVersion, seed, params)` always lead to byte-for-byte identical outputs.

## Scenario Model

A scenario is defined as:

```ts
interface Scenario {
  kind: 'linear' | 'halving' | 'unlocks';
  startDate: string; // ISO month, e.g. 2025-01-01
  horizonMonths: number; // inclusive horizon
  params: Record<string, unknown>;
}
```

Supported scenario kinds:

- **Linear emissions** — `params` include:
  - `initialSupply`: circulating supply at `startDate`.
  - `emissionPerMonth`: constant mint rate.
  - `burnPerMonth`: optional deterministic burn per month.
  - `maxSupply`: hard cap; emissions stop when reached.
- **Halving** — parameters:
  - `initialSupply`: circulating supply at `startDate`.
  - `baseEmission`: mint rate prior to halving.
  - `halvingPeriodMonths`: months between halvings.
  - `maxSupply`: hard cap.
- **Unlock schedules** — parameters:
  - `initialSupply`: total supply (circulating + locked) at `startDate`.
  - `allocations`: `{ team, treasury, community }` token allocations.
  - `schedules`: per-role vesting schedules `{ cliffMonths, vestingMonths }`.

## Ledger State

For each month `t` the engine produces a ledger state:

```ts
interface LedgerState {
  monthIndex: number;
  date: string; // YYYY-MM
  totalSupply: number;
  circulating: number;
  locked: { team: number; treasury: number; community: number; };
  inflation: number; // percentage
  minted: number;
  burned: number;
  unlocked: { team: number; treasury: number; community: number; };
}
```

The conservation requirement `circulating + team + treasury + community == totalSupply` must hold within a tolerance of `1e-6`.

## Invariants

The engine enforces the following invariants on every run:

1. **Non-negative balances** — circulating, locked buckets, and total supply are always `>= 0`.
2. **Conservation of supply** — circulating + locked buckets equals total supply within tolerance.
3. **Unlock caps** — cumulative unlocks for each role never exceed their allocation.
4. **Halving curve** — for halving scenarios, minted amounts follow `baseEmission / 2^{epochsPassed}`.

Violations are emitted as structured breaches and are surfaced in evidence reports.

## Artifacts

Each run emits deterministic artifacts in the `artifacts/tokenomics/<simulationId>/` directory:

- `run.json` — configuration, model version, seed, summary statistics, and invariant results.
- `timeseries.csv` — ledger state table in chronological order.
- `plots.svg` — deterministic line plot for total and circulating supply.
- `evidence.md` — markdown report summarising claims and checks.

Artifacts are hashed (SHA-256) and the digest is emitted into the audit stream.

## Determinism

Determinism is provided by:

- A pure functional core with no external side effects during computation.
- A custom linear congruential generator seeded by the caller.
- Sorted keys and explicit formatting for CSV and SVG outputs.

Golden files are committed alongside tests to guarantee regressions are detected when output changes.

## Evidence Hooks

The engine surfaces claims used by the evidence bus:

- Circulating supply per month.
- Max inflation over the horizon.
- Unlock caps respected for each allocation bucket.

The GraphQL gateway signs the evidence hash and attaches the audit event to the simulation.

## Observability

The engine exposes the following span names for OTel integration:

- `simulate.run`
- `simulate.step`
- `evidence.build`
- `artifact.write`

Metrics: `sim_runs_total{scenario}`, `invariant_violations_total{rule}`, and `run_seconds_bucket` (histogram).

