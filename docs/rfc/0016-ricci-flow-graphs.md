# RFC 0016 — Ricci Flow on Graphs

## Summary

This RFC introduces a curvature-aware metric flow engine for GraphLab. It measures Forman and Ollivier edge curvatures, runs a
stabilised Ricci flow on weights, and exports new embeddings and artifacts that surface community structure and bottlenecks.

## Goals

- Provide a deterministic curvature pipeline (fixed seeds, bounded epsilon, guardrails for connectivity).
- Support both Forman (fast, combinatorial) and Ollivier (Sinkhorn transport) curvature estimators.
- Expose a semi-implicit Ricci update with line search, weight floors, and sum-preserving normalisation.
- Ship layouts derived from the flowed metric (metric MDS, spectral, PowerLloyd bridge) together with stress diagnostics.
- Wire GraphLab and the CLI so operators can launch flows, inspect artifacts, and replay steps.

## Design

### Curvature engines

1. **Forman curvature** — local combinatorial expression \(\kappa_F(e) = 4 - \deg(u) - \deg(v)\).
2. **Ollivier curvature** — Wasserstein-1 between one-step neighbourhood measures. We rely on the Schrödinger Bridge engine for
   log-domain Sinkhorn iterations. Entropic regularisation (ε) and iteration caps guarantee convergence and determinism.

Both engines expose metrics (`averageKappa`, `negativeRatio`, `sinkhornIterations`) so we can chart health over time.

### Ricci flow update

Weights evolve with a semi-implicit step:

\[
  w_e^{(t+1)} = \max(\epsilon_w, w_e^{(t)} (1 - \tau (\kappa_e - \kappa_e^*)))
\]

Key safety rails:

- **Weight floor** to avoid disconnecting the graph.
- **Renormalisation** to preserve total weight mass.
- **Line search** (halve τ when stress rises or connectivity is threatened).
- **Stress metric** based on weight variance to confirm monotonic decrease.

### Embeddings & artifacts

- Metric MDS using classical scaling + Jacobi eigensolver.
- Spectral layout (normalised Laplacian) derived from flowed weights.
- PowerLloyd bridge that converts embeddings into density/seeds for blue-noise renderers.

Artifacts written per run:

- `curvature.csv`, `weights.csv`, `stress.json`, `layout.png`, `flow.webm` (JSON placeholder for now).

### Interfaces

- **GraphGateway** GraphQL schema gets `ricciRun`, `ricciLayout`, `ricciStep`, `ricciJob`, `ricciEvents`.
- **CLI** adds `blackroadctl graph ricci-run` and `blackroadctl graph ricci-layout`.
- **GraphLab UI** adds a Ricci tab, curvature legend, and control inputs for τ/engine.

## Determinism

- All random draws use Mulberry32 with fixed seeds.
- Sinkhorn tolerances and iteration caps locked at compile time.
- Layout artifacts written via a custom PNG encoder to avoid platform differences.

## Metrics

- `averageKappa`, `negativeRatio`, `sinkhornIterations`, `stress` recorded per step.
- CLI/GraphQL return metrics payloads so dashboards can chart them.

## Future work

- Export per-node curvature aggregates for richer overlays.
- Support weighted Forman curvature once higher-order cell data arrives.
- Replace placeholder `flow.webm` with streamed frames once the video writer is available in this workspace.
- UI live preview that calls `/ricciStep` for interactive scrubbing.
