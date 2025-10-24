# RFC 0012 — Schrödinger Bridge Engine (Entropic Optimal Transport)

**Status:** Proposed • **Authors:** Blackroad OT Guild • **Updated:** 2025-03-07

## Motivation

Labs requested a deterministic, GPU-friendly optimal transport solver that can interpolate between noisy inputs and produce audit-ready
artifacts. Classical OT solvers struggle with high resolution grids and are brittle when distributions are slightly inconsistent. The
Schrödinger Bridge formulation adds entropy, giving us smooth couplings, fast Sinkhorn iterations, and stable diagnostics suitable for
live demos and reproducible pipelines.

## Goals

- Entropic Sinkhorn solver that supports grids up to 512×512 via tiling.
- Deterministic artifacts: `pi.npz`, `map.png`, `frames.webm`, `diagnostics.json`.
- Telemetry for each iteration (`sb.sinkhorn.iter`) and Prometheus metrics for convergence.
- CLI + GraphQL interfaces feeding the Labs UI and control-plane automation.
- Log hygiene (no raw tokens) and leak-scan hooks in CI.

## Architecture

```
packages/sb-engine        # numerical core + artifact writers
packages/sb-gateway       # GraphQL façade + job store
packages/blackroadctl     # headless runners
sites/blackroad           # Labs UI
```

The engine works in log-space to prevent underflow:

- Pre-compute `logK = -C / ε` (with tiling for large matrices).
- Alternate updates `log u_i = log μ_i − LSE_j(logK_ij + log v_j)` and the symmetric column step.
- Build the coupling `π_ij = exp(logK_ij + log u_i + log v_j)` only when we need diagnostics or artifacts.

We clamp inputs to `Number.EPSILON`, track marginal residuals every `checkInterval`, and capture the dual gap via the diagnostics helper.

## GPU + Tiling Strategy

- CPU fallback uses typed arrays and chunked matmuls.
- GPU path (Phase 2) targets WebGPU/WebGL via `tiled_matmul` abstraction — tiles are square blocks sized to fit shared memory.
- Deterministic tiling order (row-major) ensures byte-stable outputs.

## Diagnostics & Observability

Diagnostics capture

- primal cost `Σ π_ij C_ij + ε Σ π_ij (log π_ij − 1)`
- marginal error `max(||π 1 − μ||₁, ||πᵗ 1 − ν||₁)`
- KL divergence `KL(π || μ ⊗ ν)`

OTel spans:

- `sb.sinkhorn` root span per job.
- `sb.sinkhorn.iter` child span per iteration with attributes `sb.iter`, `sb.marginal_error`, `sb.dual_gap`.

Prometheus:

- Histogram `sb_sinkhorn_iterations`.
- Gauge `sb_sinkhorn_marginal_error`.

## Failure Modes & Mitigations

| Failure | Mitigation |
| --- | --- |
| `NaN` in log domain | Clamp inputs, skip zero weights, track NaN count each iteration. |
| Slow convergence when ε → 0 | Allow warm starts, expose continuation schedule (decrease ε gradually). |
| Memory blowup for 512² grids | Tile cost matrix + streamed marginal checks. |
| Non-deterministic artifacts | Seed downsampling, fixed tiling order, freeze png/webm writers. |

## Continuation Schedule

For high contrast inputs, start with ε₀ ≈ 0.5, run ≤100 iterations, then halve ε until you reach target (e.g., 0.05). Warm start with
previous `log u`/`log v` to accelerate convergence.

## Deliverables

- `sb-engine`: costs, log-sinkhorn, barycentric, interpolation, artifact I/O, tests + goldens.
- `sb-gateway`: GraphQL schema (`sbRun`, `sbFrames`, `sbJob`, `sbEvents`), RBAC, telemetry hooks.
- `blackroadctl`: `ot sb-run` + `ot sb-frames` commands.
- `SBLab` page with tuner + teaching prompts.
- CI workflow enforcing unit tests, deterministic artifacts, and leak scans on gateway logs.

## Rollout

1. Week 1 — engine + CLI (this RFC). Verify golden images + marginal tests.
2. Week 2 — gateway, Labs UI, GPU experiments.
3. Week 3 — docs, guardrails, enable feature flag in production.

## References

- Peyré, Cuturi (2019) — *Computational Optimal Transport*.
- Séjourné et al. (2023) — *Sinkhorn Divergences for Schrödinger Bridges*.
- Codex Prompt 007 FigJam — system diagram for SB pipeline.
