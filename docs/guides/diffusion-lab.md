# DiffusionLab Guide

DiffusionLab is a playground for exploring stochastic processes through both Monte Carlo sampling and finite-difference density evolution. This guide covers the preset configurations, CLI helpers, and the interactive UI surface.

## Presets

We ship two potential presets and a toy score model:

- **Double well** — \(U(x, y) = \tfrac{1}{4}(x^2 - 1)^2 + \tfrac{1}{2} y^2\)
- **Gaussian mixture** — weighted sum of two isotropic Gaussians positioned along the \(x\)-axis
- **Annealed score** — a time-dependent score field that interpolates between a broad Gaussian prior and a narrow mode

Each preset can be referenced by name in CLI commands, GraphQL mutations, or the UI.

## CLI Usage (`blackroadctl`)

```bash
# Run an Euler–Maruyama sampling experiment
blackroadctl diffusion run --mode sde --potential double_well --steps 500 --dt 0.01 --particles 8000

# Solve the matching Fokker–Planck PDE
blackroadctl diffusion run --mode fp --potential double_well --steps 400 --dt 0.005 --grid 128

# Compare runs by job identifiers and emit metrics
blackroadctl diffusion compare --sde <JOB_ID_SDE> --fp <JOB_ID_FP>

# Export timeline frames as a WebM video
blackroadctl diffusion export --job <JOB_ID_FP> --output artifacts/diffusion/doublewell.webm
```

## GraphQL

The gateway exposes three mutations and a job lookup query.

```graphql
mutation RunSDE($cfg: SDEConfig!) {
  diffusionRunSDE(cfg: $cfg) { id status artifacts { kind path } }
}

mutation RunFP($cfg: FPConfig!) {
  diffusionRunFP(cfg: $cfg) { id status metrics }
}

mutation Compare($sde: ID!, $fp: ID!) {
  diffusionCompare(sdeJob: $sde, fpJob: $fp) { id metrics }
}
```

Subscriptions stream job updates as they complete individual steps. All resolvers attach OpenTelemetry spans (`diff.sde.step`, `diff.fp.step`, `diff.compare.metrics`) and Prometheus counters prefixed with `diff_`.

## UI Overview

1. **FieldView** — renders potential contours, vector fields, particle snapshots, and PDE density heatmaps.
2. **Timeline** — scrub through time, play/pause animations, or export the currently selected sequence as PNG or WebM.
3. **ChatPanel** — shows structured log messages with emoji breadcrumbs. Commands such as `/rerun`, `/anneal beta=...`, `/pause`, and `/export` are routed back to the CLI helpers.

## Determinism Checklist

- Fix seeds when running the engines.
- Keep matching time steps and grid sizes when comparing SDE and PDE outputs.
- Avoid reconfiguring bandwidth midway through a run unless you intend to branch the job.

## Troubleshooting

- **Mass drift** — ensure the boundary setting is `neumann` for reflective behaviour. Periodic boundaries are only stable for symmetric potentials.
- **Diverging KL** — the PDE solver may require a smaller `dt` or additional Gauss–Seidel iterations. The CLI warns when the Helmholtz solver fails to converge.
- **Visual aliasing** — increase the grid resolution or KDE bandwidth for smoother overlays.

