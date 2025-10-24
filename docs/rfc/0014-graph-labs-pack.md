# RFC 0014 — Graph Labs Pack

## Summary

The Graph Labs Pack bundles three numerical engines—spectral embeddings, PowerLloyd centroidal diagrams, and a Cahn–Hilliard phase-field solver—into a single workspace. The lab links engine outputs via deterministic bridges and exposes results through the ArtifactViewer and ChatPanel.

## Goals

- Provide deterministic spectral embeddings and clustering diagnostics.
- Offer blue-noise style layout iteration via weighted Lloyd updates.
- Deliver a semi-implicit Cahn–Hilliard solver for denoising or segmentation tasks.
- Ensure bridges allow chaining: spectral → density → layout → phase.
- Surface observability (OTel spans, residual metrics) and RBAC enforcement.

## Architecture

1. **Engines package (`@blackroad/graph-engines`)**
   - Dense Jacobi eigen decomposition for normalized Laplacians.
   - Power diagram assignments on a raster density grid.
   - Phase field evolution with periodic finite differences and mean preservation.

2. **Graph Gateway (`@blackroad/graph-gateway`)**
   - GraphQL schema exposing job-oriented mutations and RBAC guards.
   - Minimal in-memory job registry suitable for CLI and prototype usage.

3. **CLI commands (`blackroadctl graph:*`)**
   - File-based workflows for embeddings, layouts, phase updates, and bridges.
   - Telemetry hooks align with existing CLI instrumentation.

4. **GraphLab UI**
   - Controls for parameter tweaks, ArtifactViewer integration, and ChatPanel wiring.
   - Placeholder visuals ensure immediate feedback even before backend wiring.

## Determinism

- Uses a Mulberry32 RNG with explicit seeds.
- Raster density grid normalized to maintain consistent totals.
- Phase solver enforces mass conservation via mean subtraction per step.

## Observability & Security

- Gateway spans emit debug logs when `GRAPH_LABS_DEBUG` is set.
- RBAC helper enforces role ordering: viewer < operator < admin.
- CLI asserts capabilities `graph:*` before touching files.

## Open Questions

- Swap dense Jacobi solver for sparse Lanczos when integrating large graphs.
- Replace placeholder UI visuals with live artifacts from the gateway.
- Expand golden tests once PNG rendering utilities land in the workspace.
