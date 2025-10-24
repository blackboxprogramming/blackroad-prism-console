# RFC 0015 — HJB Lab PDE and MDP Solvers

## Summary

This RFC captures the architecture for the Hamilton–Jacobi–Bellman Control Lab. The lab ships two
solver paths—continuous PDE and discrete MDP—along with deterministic artifact generation and
playable rollouts. The goal is to provide a cohesive teaching surface that mirrors the control
pipeline: define dynamics, compute value functions, inspect policies, and rehearse trajectories.

## Goals

- Provide a first-order upwind/Godunov discretization for stationary and time-dependent HJB PDEs.
- Supply a discrete value-iteration engine with deterministic tie-breaking and greedy policies.
- Export artifacts (`V.csv`, `policy.csv`, quiver text, rollout logs) and surface them in the UI.
- Ensure reproducible runs (fixed seeds, deterministic control grids) and trace telemetry via OTel.
- Guard access with RBAC (viewer/operator/admin) at the gateway entry point.

## PDE Solver

We discretize the stationary HJB equation

```
0 = min_u { ℓ(x, u) + ∇V(x) · f(x, u) }
```

using a monotone Godunov scheme. Let `Vᵢ` denote the value at grid cell `i`, `Δx` the grid spacing,
and `H(x, p)` the Hamiltonian. The scheme advances a pseudo-time iteration until the residual falls
below a tolerance:

```
Vⁿ⁺¹ᵢ = Vⁿᵢ − ω · H(xᵢ, ∇₍godunov₎ Vⁿᵢ)
```

where `ω` is a damping factor. Gradients are computed with one-sided differences selected according
to characteristic directions. The time-dependent variant integrates

```
∂ₜ V + H(x, ∇V) = 0
```

via forward Euler under a CFL constraint `Δt ≤ CFL · min(Δx) / max‖f‖`.

### Invariants

- Residuals (`‖Vⁿ⁺¹ − Vⁿ‖∞`) decrease monotonically once within the contraction region.
- Gradients are bounded—no NaN/Inf propagation; guard rails clamp boundary lookups.
- Control grids are deterministic: a fixed resolution generates a fixed sample ordering.
- Telemetry spans: `hjb.pde.stationary`, `hjb.pde.time`, `hjb.pde.step` emit iteration metadata.

## MDP Solver

The discrete path casts the control problem as value iteration:

```
Vₖ₊₁(s) = min_u [ r(s, u) + γ ∑_{s'} P(s' | s, u) Vₖ(s') ]
```

We build the state lattice from the same grid specification. Actions are sampled deterministically
from the control bounds. Transitions advance the dynamics through an Euler step and snap to the
nearest lattice cell. Gauss–Seidel sweeps continue until the sup-norm residual drops below the
configurable tolerance. Greedy policies resolve ties by selecting the first action seen, ensuring a
deterministic policy map.

### Invariants

- Sup-norm residual decreases each sweep; convergence metrics emitted via `hjb.mdp.iter`.
- Tie counts are tracked to highlight nearly-flat Q surfaces.
- Transition tables are deterministic: nearest-neighbour selection is order-stable.

## Rollouts & Artifacts

Rollouts reuse the dynamics and policies to produce deterministic traces (`samples` array with state,
control, stage cost). Artifacts include:

- `V.csv` — coordinate + value table
- `policy.csv` — coordinate + control
- `quiver.png` (textual in this MVP) — normalized gradient heatmap
- `rollout.webm` — JSON payload for deterministic playback

The exporter normalizes value ranges, rounds coordinates, and writes all files beneath a job-specific
temporary directory.

## Gateway & RBAC

The GraphQL façade exposes mutations for PDE solves, MDP solves, and rollouts. All mutations require
`operator` or `admin`; viewers may fetch job metadata and subscribe to job events. Internal job store
captures artifacts, metrics, and solver payloads for downstream rollouts.

Telemetry spans (`hjb.gateway.pde`, `hjb.gateway.mdp`, `hjb.rollout.sim`) wrap long-running work.

## CLI

Two CLI entry points land under `blackroadctl control`:

- `hjb-solve --config config.json` runs a PDE/MDP solve and writes artifacts.
- `hjb-rollout --config config.json [--start x,y]` replays a rollout using the same configuration.

Both commands reuse the deterministic helpers and respect telemetry hooks.

## UI

The `HJBLab` page combines preset selectors, a quiver canvas, trajectory playback, artifact viewer,
and chat feed. Sample prompts (`🧭`, `🧱`, `🧪`) guide operators toward boundary effects, CFL tuning,
and Q-value ties.

## Future Work

- Encode quiver outputs as real PNGs (current MVP uses text serialization).
- Persist job records beyond process lifetime; stream GraphQL subscriptions to UI.
- Enrich CLI rollout command to read existing artifact directories.
