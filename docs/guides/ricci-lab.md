# GraphLab Ricci Flow Guide

Ricci Flow smooths the metric on a graph so that bottlenecks relax and communities separate. This guide walks through the controls,
CLI commands, and artifacts included in the MVP.

## TL;DR

1. Collect an edge list (CSV or whitespace separated `u v [w]`).
2. Run `blackroadctl graph ricci-run --edge-list data/graph.txt --curvature ollivier --tau 0.04 --iters 30`.
3. Open the generated artifacts (`curvature.csv`, `weights.csv`, `stress.json`, `layout.png`).
4. Use `blackroadctl graph ricci-layout --edge-list ... --weights ... --layout spectral` to re-embed without re-running flow.
5. In GraphLab, switch to the **Ricci** tab, tweak τ/curvature, and watch the layout respond.

## Controls

| Control       | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| Curvature     | `forman` (fast combinatorial) or `ollivier` (transport using Sinkhorn OT).  |
| τ step        | Multiplicative step size. Line search halves τ when stress increases.       |
| Spectral k    | Target dimension for the spectral baseline (used by other tabs).            |
| Iterations    | Number of Ricci steps to simulate before producing artifacts.               |

Emoji breadcrumbs in the UI map to the workflow: `🧭` choose params → `🧰` helper extracted → `🧪` test → `📈` metric → `🧱` invariant.

## CLI

```bash
# Run flow + layout artifacts
blackroadctl graph ricci-run \
  --edge-list examples/karate.txt \
  --curvature ollivier \
  --tau 0.05 \
  --iters 25 \
  --layout mds \
  --out artifacts/graph/ricci

# Re-embed from stored weights (no flow)
blackroadctl graph ricci-layout \
  --edge-list examples/karate.txt \
  --weights artifacts/graph/ricci/weights.csv \
  --layout spectral
```

Both commands enforce the `graph:ricci` capability and emit telemetry scopes (`graph.ricci-run`, `graph.ricci-layout`).

## GraphQL

```graphql
mutation {
  ricciRun(edgeList: "0 1\n1 2\n", cfg: { curvature: "forman", tau: 0.04, iterations: 20 }) {
    id
    metrics
    artifacts { path description }
  }
}
```

Follow-up mutations `ricciLayout(jobId: ...)` and `ricciStep(jobId: ...)` reuse the stored weights. Subscribe to `ricciEvents` for
live progress updates.

## Artifacts

| File              | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `curvature.csv`   | Edge ID + curvature column (Forman/Ollivier).                   |
| `weights.csv`     | Final edge weights after flow (source, target, weight).         |
| `stress.json`     | Stress per iteration (`iteration`, `stress`).                    |
| `layout.png`      | 256×256 PNG with curvature heat overlay (blue=negative).        |
| `flow.webm`       | JSON-encoded placeholder storing stress frames for future video |

The PNG encoder is deterministic and avoids floating artefacts by using fixed scaling.

## Troubleshooting

- **Disconnected graph?** Increase `epsilon` or reduce τ. The solver halves τ automatically when stress increases.
- **Slow Ollivier runs?** Tune `cfg.sinkhorn = { sinkhornEps: 0.02, sinkhornIters: 150 }` for coarser transport.
- **UI not updating?** Use `/ricciStep` in chat to replay the latest iteration and update the artifacts pane.

Happy flowing! ♾️
