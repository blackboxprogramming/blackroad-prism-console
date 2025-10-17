# Universal Simulation Benchmark Spec

## Scenario Overview
- **Objective**: Evaluate Genesis-generated multiphysics scenes against reference solid and fluid simulations.
- **Scope**: Focus on a hybrid scenario where a deformable solid impacts a shallow fluid domain, tracking contact, stress, and splash metrics.
- **Datasets**: Genesis outputs (geometry, materials, boundary conditions) alongside reference solver results for both solid (MPM/FEM/SOFA) and fluid (SPH/FLIP) baselines.

## Simulation Sequence
1. Generate the canonical scene via Genesis using the prompt and configuration in `10_genesis/`.
2. Run the solid benchmark in `20_bench_solid/` with the exported Genesis scene.
3. Run the fluid benchmark in `30_bench_fluid/` using the same initial conditions.
4. Post-process all outputs with the analytics helpers in `40_compare/`.

## Required Artifacts
- Genesis export: geometry, materials, time-series states, and metadata.
- Solid benchmark dump: nodal positions, stresses, contact timings.
- Fluid benchmark dump: particle positions, heights, and per-step masses.
- Consolidated report captured in `90_reports/`.

## Acceptance Criteria
- ✅ Genesis and benchmark scripts produce reproducible outputs with command-line entrypoints.
- ✅ Metrics compute without manual edits given `.npz`/`.ply` exports from the simulations.
- ✅ Diagnostic plots highlight energy and mass trends for sanity checks.
- ✅ Final report summarizes qualitative differences, metric tables, and screenshots.

## Open Questions
- How should Genesis map materials to downstream solvers?
- What is the canonical timestep / frame rate for comparing contact events?
- Which reference solvers should be considered authoritative for regression testing?

Document outstanding decisions here as the project evolves.
