# RFC 0017 — Diffusion / Fokker–Planck Lab

## Summary

This document describes a dual-engine sandbox for stochastic differential equations (SDEs) and the matching Fokker–Planck partial differential equation (PDE). The lab is designed to let researchers explore sampling dynamics, check invariants, and compare Monte Carlo and grid-based evolutions within a shared set of interfaces.

## Goals

- Treat the Euler–Maruyama sampler and the semi-implicit Fokker–Planck solver as first-class, composable engines.
- Make deterministic reproductions possible via seeded RNG and fixed grids.
- Expose observability hooks (OpenTelemetry spans, Prometheus metrics) across both engines and the comparison layer.
- Surface outputs through CLI, GraphQL, and the DiffusionLab UI with shared artifact semantics.

## Equations

We work with the overdamped Langevin SDE and the corresponding Fokker–Planck equation.

### Stochastic Differential Equation

Let \(X_t \in \mathbb{R}^2\) evolve according to

\[
\mathrm{d}X_t = f(X_t, t)\,\mathrm{d}t + \sqrt{2\beta(t)}\,\mathrm{d}W_t
\]

where \(f\) is either the negative gradient of a potential \(U\) or an externally supplied score \(s\), \(\beta(t)\) is the scalar diffusion schedule, and \(W_t\) is standard Brownian motion.

We integrate with Euler–Maruyama:

\[
X_{t+1} = X_t + f(X_t, t)\,\Delta t + \sqrt{2\beta(t)\Delta t}\,\xi_t,
\]

with \(\xi_t \sim \mathcal{N}(0, I)\). Particles carry deterministic seeds so that repeated runs produce identical trajectories.

### Fokker–Planck PDE

The density \(p(x, t)\) for the process satisfies the Fokker–Planck equation

\[
\partial_t p = \nabla\cdot(p\nabla U) + \beta(t)\,\Delta p.
\]

We discretise the domain \([-L, L]^2\) using a regular grid and apply a semi-implicit scheme: the drift term is taken explicitly while diffusion is advanced implicitly by solving a discrete Helmholtz system per time step.

Boundary conditions may be Neumann (zero flux) or periodic. Neumann boundaries mirror ghost cells and keep the net probability flux at the boundary zero; periodic boundaries wrap the grid.

## Numerical Scheme

1. **Drift advection**: compute \(\nabla \cdot (p \nabla U)\) explicitly using second-order central differences.
2. **Diffusion solve**: solve \((I - \Delta t\,\beta L) p^{n+1} = p^n - \Delta t\,\nabla\cdot(p^n \nabla U)\) using a conjugate gradient solver tailored for the sparse Laplacian operator \(L\).
3. **Mass check**: ensure \(\sum p^{n+1}\) is conserved within a tolerance (default \(10^{-6}\)).

## Metrics

To compare SDE and PDE evolutions we track:

- **KL divergence** \(\mathrm{KL}(p_{\mathrm{sde}} \Vert p_{\mathrm{pde}})\)
- **Jensen–Shannon divergence**
- **Maximum Mean Discrepancy (MMD)** with an RBF kernel and adaptive bandwidth
- **Entropy** of each marginal density

## Observability

- Spans: `diff.sde.step`, `diff.fp.step`, `diff.compare.metrics`
- Prometheus metrics: `diff_sde_step_seconds`, `diff_pde_step_seconds`, `diff_kl_curve`, `diff_mmd`, `diff_entropy`, `diff_particles_active`, `diff_grid_cells`

## Interfaces

- **CLI (`blackroadctl`)**: run solvers, compare runs, and export frame sequences as WebM files.
- **GraphQL (`diffusion-gateway`)**: exposes mutations for SDE runs, PDE runs, and pairwise comparisons. Jobs are recorded in an in-memory registry suitable for iterative prototypes.
- **DiffusionLab UI**: React components for field visualisation, timeline scrubbing, and ChatPanel streaming.

## Determinism

- RNG: Mulberry32 generator wrapped with Box–Muller to produce Gaussian pairs.
- Grid spacing, iteration counts, and solver tolerances are fixed for reproducibility.
- Artifacts are versioned by job identifier and frame index.

## Future Work

- Support higher-dimensional SDEs with low-discrepancy sampling.
- GPU acceleration for the PDE solver.
- External score model integration.
- Adaptive mesh refinement around high-curvature density ridges.

