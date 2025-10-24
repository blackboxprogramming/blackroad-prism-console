# RFC 0011 — Dynamic Optimal Transport via Benamou–Brenier

## Motivation

Displacement interpolation and dynamic flows animate how mass travels between densities. The Benamou–Brenier formulation treats transport as minimum kinetic energy subject to the continuity equation. Building a deterministic implementation unlocks fluid-like diagnostics, supports interpolation artifacts, and aligns with the Observability stack (metrics + traces per solver phase).

## Formulation

We discretize time into $K$ steps with timestep $\Delta t = 1/K$. For each slice we maintain densities $\rho^k$ on cell centers and momentum $m^k = \rho^k v^k$ on the same grid. The continuity equation becomes

$$\frac{\rho^{k+1} - \rho^k}{\Delta t} + \nabla \cdot m^k = 0.$$

The kinetic energy term uses the midpoint density $\bar{\rho}^k = (\rho^{k+1} + \rho^k)/2$:

$$\sum_{k=0}^{K-1} \frac{\Delta t}{2} \int \frac{\|m^k\|^2}{\bar{\rho}^k} dx.$$

## Discretization Strategy

- **Path Initialization** — start from linear interpolation between $\rho_0$ and $\rho_1$.
- **Divergence Solve** — for each timestep we solve a discrete Poisson problem for a potential $\psi^k$ so that $m^k = -\nabla \psi^k$ has minimal $L^2$ norm while satisfying $\nabla\cdot m^k = -\Delta_t(\rho^{k+1}-\rho^k)$.
- **Velocity Recovery** — convert momentum to velocity via $v^k = m^k / \bar{\rho}^k$ with an $\varepsilon$ floor for numerical stability.
- **Continuity Check** — evaluate the residual $\left\|\frac{\rho^{k+1}-\rho^k}{\Delta t} + \nabla\cdot(\bar{\rho}^k v^k)\right\|_\infty$ as the stopping metric.

## Implementation Notes

- The Poisson solver uses Jacobi iterations with Neumann (zero-flux) boundary conditions so that no mass escapes the grid.
- Gradients and divergences rely on centered / backward finite differences; loops are deterministic.
- Costs accumulate as `0.5 * dt * sum((rhoAvg * vx)^2 + (rhoAvg * vy)^2) / rhoAvg`.

## Outputs

The solver returns:

- The list of density frames (including endpoints).
- Velocity fields and midpoint densities per timestep.
- Per-step costs, the total cost, and the maximum continuity residual.

## Validation

`dynamic.flow.continuity.spec.js` verifies:

- continuity residual below $5\times 10^{-3}$;
- finite velocities and positive costs;
- deterministic frame count for reproducibility.

## Future Work

- Upgrade Poisson solve to a multigrid or FFT-based solver for faster convergence.
- Support regularization (e.g., quadratic penalty or entropic smoothing).
- Integrate particle tracing to visualize Lagrangian trajectories in the OT Lab.
