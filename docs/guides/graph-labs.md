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
