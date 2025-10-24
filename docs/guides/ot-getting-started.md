# Optimal Transport Engine — Getting Started

This guide walks through the new optimal transport core and how to exercise it from the CLI, labs, and tests.

## Install & Build

```bash
npm install
pnpm --filter blackroadctl build
```

## Semi-Discrete Solver

```bash
blackroadctl ot solve \
  --kind semidiscrete \
  --source fixtures/ot/rho0.json \
  --target fixtures/ot/sites.json \
  --out artifacts/ot
```

The JSON density format mirrors the solver input:

```json
{ "width": 64, "height": 64, "data": [0.001, ...] }
```

The command prints iteration counts, max relative mass error, and the deterministic artifact paths (Laguerre map text + JSON summary). The underlying kernel lives in `packages/ot-engine/src/semidiscrete` and exposes:

- `solveWeights` — weight iteration with backtracking;
- `rasterizePowerDiagram` — deterministic raster Laguerre ownership;
- `computeDensityMass` — convenience integrator for density fields.

## Dynamic Solver (Benamou–Brenier)

```bash
blackroadctl ot solve --kind dynamic \
  --source fixtures/ot/rho_start.json \
  --target fixtures/ot/rho_goal.json \
  --steps 12
```

Outputs include per-step costs, continuity residual, and velocity fields serialized to JSON. Use `blackroadctl ot interpolate --job <path-to-job.json> --t 0.2` to extract displacement frames.

## Labs UI

Open the OT Lab at `http://localhost:3000/ot` when running `npm run dev:site`. The page provides:

- drawing tools for source/target densities;
- live charts for cell mass error and continuity residual;
- playback scrubber for displacement interpolation.

## Tests & Determinism

```bash
npm test -- --runTestsByPath packages/ot-engine/tests/semidiscrete.conservation.spec.js
npm test -- --runTestsByPath packages/ot-engine/tests/dynamic.flow.continuity.spec.js
```

Both tests run in CI (`.github/workflows/ot-ci.yml`) and verify the golden Laguerre tessellation plus the dynamic continuity residual.

## Observability

Both solvers emit spans (`ot.semidiscrete.weight_update`, `ot.dynamic.poisson`) via the OT gateway. Review them in the RoadStudio telemetry UI to compare seeds, grid sizes, and convergence behavior.
