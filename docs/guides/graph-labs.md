# Graph Labs Guide

The Graph Labs workspace stitches together spectral analysis, blue-noise layout, and phase-field smoothing. This guide highlights the fastest way to exercise each component.

## Spectral Engine

```
brc graph:embed --edge-list fixtures/graphs/toy.edgelist --k 8 --seed 7 --out artifacts/graph/embed
```

The CLI writes `spectral_embedding.csv` and `spectral_eigenvalues.json`. The CSV feeds into the PowerLloyd layout helper.

## PowerLloyd Layout

```
brc graph:layout --embedding artifacts/graph/embed/spectral_embedding.csv --seed 13 --out artifacts/graph/layout
```

The layout command consumes embedding coordinates, generates a density field, and emits `layout.json` with convergence metrics.

## Cahn–Hilliard Phase Field

```
brc graph:phase --init artifacts/graph/layout/layout.json --steps 120 --out artifacts/graph/phase
```

Each frame is stored as `frame_X/phase_field.json`, suitable for playback within ArtifactViewer.

## Bridges

Use `brc graph:bridge` to run spectral → density and layout → phase hand-offs in one swoop. The command emits `bridge.json` summarizing the intermediate payloads.

## UI Entry Point

Navigate to `/labs/GraphLab` on the BlackRoad site. The controls column dispatches jobs and provides emoji breadcrumbs, while ArtifactViewer and ChatPanel stay in sync with the most recent run.
# Graph Labs — Quickstart

The Graph Labs workspace combines spectral embeddings, Power-Lloyd blue-noise layouts, and Cahn–Hilliard phase-field smoothing. This guide walks through the fastest path to running all three engines and inspecting artifacts.

## Prerequisites

* Node.js 18+
* `pnpm install` at repo root
* Optional: running `graph-gateway` service (defaults to `http://localhost:4800/graphql`)

## CLI

Run the spectral engine from the CLI:

```bash
pnpm --filter blackroadctl exec ts-node src/bin.ts graph:embed --edges ./fixtures/graphs/cycle.edgelist --k 3
```

New commands accept inline strings as well:

```bash
export GRAPH_GATEWAY_ENDPOINT=http://localhost:4800/graphql
pnpm --filter blackroadctl exec ts-node src/bin.ts graph:layout --density "0.2 0.3 0.4\n0.6 0.8 0.2" --sites 8
pnpm --filter blackroadctl exec ts-node src/bin.ts graph:phase --field "-0.5 0.3\n0.1 -0.2" --steps 80
```

Use the bridge command to push spectral clusters into a phase run:

```bash
pnpm --filter blackroadctl exec ts-node src/bin.ts graph:bridge --spectral-job spectral-0001 --layout-job power-0001
```

## GraphQL

`spectralRun`, `powerLloydRun`, and `cahnRun` mutations return job IDs, metrics, and artifact metadata.

```graphql
mutation Demo {
  spectralRun(edgeList: "0 1\n1 2\n2 3\n3 0", k: 3) {
    id
    metrics
    embedding
    artifacts { path description }
  }
}
```

Fetch a job via query:

```graphql
query ($id: ID!) {
  spectralJob(id: $id) {
    status
    embedding
  }
}
```

## UI

Visit `/labs/graph` on the BlackRoad site. The page ships with three columns:

1. **Controls** — fire spectral, layout, phase, or full pipeline runs.
2. **Graph Canvas** — summarize metrics, clusters, density, and phase residuals.
3. **Artifact Viewer + Chat Panel** — surface deterministic ASCII artifacts and append emoji breadcrumbs.

GraphQL failures fall back to local demo data so the UI remains informative offline.

## Tests

```
pnpm --filter @blackroad/graph-engines test
pnpm --filter graph-gateway test
```

The spectral test checks the golden ASCII plot at `tests/golden/graph_small.embedding.png.golden`, while Cahn–Hilliard verifies mass conservation to \(10^{-5}\).

