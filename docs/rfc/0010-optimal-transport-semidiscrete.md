# RFC 0010 — Semi-Discrete Optimal Transport Core

## Motivation

RoadStudio relies on balancing laguerre (power) cells when equalizing coverage for the PowerLloyd lab. We extend that raster workflow into a reusable solver that matches arbitrary target masses for a discrete set of sites. The semi-discrete Monge–Ampère problem is a direct fit: the source density is sampled on a grid and the targets are point sites with prescribed masses. Solving for cell weights unlocks deterministic transport maps, barycentric interpolation, and diagnostics that feed the deterministic rendering pipeline.

## Problem Statement

Given a non-negative density field $\rho_0$ sampled over an orthogonal grid and target sites $\{y_i\}_{i=1}^N$ with masses $m_i$, find weights $w_i$ such that each Laguerre cell integrates to its target mass:

$$
\mathcal{L}_i = \{ x : \|x-y_i\|^2 - w_i \leq \|x-y_j\|^2 - w_j,\ \forall j\}
$$
$$
\int_{\mathcal{L}_i} \rho_0(x)\,dx = m_i.
$$

The solver must:

- converge to within 1% relative mass error;
- reuse the raster power diagram kernel from the PowerLloyd lab;
- export deterministic assignments, masses, and weights for reproducibility.

## Design

1. **Raster Power Diagram** — we rasterize Laguerre cells on the existing $W\times H$ grid. Each pixel selects the site that minimizes $\|x-y_i\|^2 - w_i$. We reuse the same $O(NWH)$ kernel as PowerLloyd but surface mass accumulation in addition to area counts.
2. **Weight Solver** — we perform damped gradient updates on weights. The gradient of the dual objective is $(\text{cellMass} - m_i)$; a backtracking step halts divergence. We normalize target masses so that the solver respects the source density’s total mass even if the caller requests a slightly different total.
3. **Determinism Hooks** — all loops are ordered; weights remain in `Float64Array` for reproducible sums. A deterministic RNG helper matches the lab’s seeded behavior.

## Algorithmic Details

- **Initialization** — weights start at zero. Optional `weightScale` adjusts sensitivity for high-resolution grids.
- **Iteration** — each iteration rasterizes the diagram, computes per-site mass, and updates weights with an adaptive step size. Backtracking (max 6 attempts) halves the step when residuals increase.
- **Stopping** — we stop when the maximum relative mass error drops below `tolerance` (default 1%).
- **Outputs** — weights, masses, areas, pixel ownership, iteration count, and convergence flag.

## Invariants & Tests

- Sum of cell masses equals the integral of the density (enforced by normalization).
- Deterministic owner map matches the stored golden fixture.
- Relative error per cell stays below the threshold in `semidiscrete.conservation.spec.js`.

## Extensions

- Replace the raster kernel with GPU/WebGPU paths for large grids.
- Add Newton-like updates using Hessian approximations to speed convergence.
- Surface barycenters and transport cost for integration with analytics dashboards.
