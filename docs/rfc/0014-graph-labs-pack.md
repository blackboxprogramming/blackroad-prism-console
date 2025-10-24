# RFC 0014 — Graph Labs Pack (Spectral + PowerLloyd + Cahn–Hilliard)

**Status**: Implemented ✅  
**Author**: BlackRoad Prism Agents  
**Created**: 2025-03-02

## Summary

This RFC introduces the Graph Labs Pack, a unified workspace combining three graph analysis engines with deterministic artifact capture and collaboration affordances.

* **Spectral engine** — builds the normalized Laplacian, extracts the smallest \(k\) eigenpairs, computes spectral embeddings, and emits seeded k-means clusters.
* **PowerLloyd engine** — iterates a weighted centroidal power diagram with density-aware mass balancing and convergence traces.
* **Cahn–Hilliard engine** — runs a semi-implicit phase-field solver to denoise or segment scalar fields while conserving mass.
* **Bridges** — pipe spectral clusters into density fields, and turn layouts into phase-field seeds.
* **UX** — a single Graph Lab page with live Artifact Viewer and Chat Panel, plus CLI + GraphQL access.

## Goals & Non-Goals

| Goal | Notes |
| --- | --- |
| Deterministic graph workflows | Seeding everywhere (`mulberry32` derivative), ASCII artifacts for portability, golden snapshots in tests. |
| Observability | Yoga middleware emits span start/finish events, jobs persist metrics for inspection. |
| RBAC | CLI + gateway enforce new `graph:*` capabilities. |
| Cross-engine bridges | Spectral density → PowerLloyd, layout → Cahn–Hilliard. |
| Non-goal | GPU acceleration, multi-node orchestration, or binary artifact streaming. |

## Architecture

```
packages/graph-engines
  spectral/       # laplacian, eigenpairs, clustering
  powerlloyd/     # power diagram raster + iteration
  cahn-hilliard/  # grid utilities + semi-implicit solver
  bridges/        # cross-engine transformations
  io/             # artifact writers
packages/graph-gateway
  schema.ts       # GraphQL types + resolvers
  resolvers/      # spectral, power, cahn, bridges
  auth/           # RBAC context
  otel.ts         # lightweight span emitter
sites/blackroad
  GraphLab.jsx    # unified UI shell
  components/     # Artifact viewer, chat panel, graph views
```

## Determinism

* `createSeededRng` hashes seeds via SHA-256 and applies LCG updates.
* All ASCII artifacts are written with fixed layout and jitter bounds.
* Tests pin golden output for `spectral_embedding.png`.

## Security & RBAC

* New CLI capabilities: `graph:spectral`, `graph:layout`, `graph:phase`, `graph:bridge`.
* Graph gateway context derives role from `GRAPH_GATEWAY_ROLE`, defaulting to `operator`.
* Bridge mutations reuse existing artifacts (written locally) without exposing raw paths.

## Observability

* Yoga middleware emits `span:start` and `span:end` events via `otel.events` emitter.
* Job records persist metrics, accessible through GraphQL queries.

## Rollout Plan

1. Land engines + gateway + CLI updates with golden tests (this change).
2. Wire GraphLab UI to GraphQL endpoint, fallback to local previews when offline.
3. Add integration workflow (`graph-labs-ci.yml`) for determinism + leak scans (future).

## Open Questions

* Streaming WebM frames: currently stored as ASCII. Worth integrating a lightweight encoder?
* Large graph scaling: Jacobi eigen solve suffices for demos but may need ARPACK in production.

