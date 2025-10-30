# Comparison & Metrics

Use this directory to compute shared metrics and visualize diagnostics across simulator
runs. The provided Python script `hausdorff_mass_metrics.py` handles:

- Symmetric Hausdorff distance + median surface error between two meshes/point clouds.
- L2 error for von Mises stress volumes (expects `.npy` arrays).
- Free-surface MSE for height grids.
- Fluid mass drift statistics from CSV logs.

## Example

```bash
python hausdorff_mass_metrics.py \
  --ref-mesh ../20_bench_solid/runs/baseline/meshes/solid_0.8s.vtk \
  --cand-mesh ../10_genesis/runs/20240229_120102_baseline/meshes/body_A_0.8s.vtk \
  --ref-stress ../20_bench_solid/runs/baseline/diagnostics/solid_0.8s_von_mises.npy \
  --cand-stress ../10_genesis/runs/20240229_120102_baseline/diagnostics/body_A_0.8s_von_mises.npy \
  --output metrics_0.8s.json
```

Store derived outputs in `derived/` to keep raw data pristine:

```
derived/
  baseline_metrics.csv
  plots/
    energy_timeseries.png
    mass_drift.png
```

Add notebooks or scripts here to aggregate metrics across runs. Document each notebook's
purpose in its first cell.

## Digital twin sandbox

`universal_hamiltonian.py` provides a small, dependency-light Hamiltonian
integrator that can emulate LC lattices, mechanical chains, or photonic
waveguides.  It uses JAX for differentiable linear algebra and Matplotlib for
visualisation.

Quick start:

```bash
cd universal-sim/40_compare
python - <<'PY'
import jax.numpy as jnp
from universal_hamiltonian import CoupledHamiltonian, simulate, plot_heatmap

n = 4
k = 1.0
K = k * (2 * jnp.eye(n) - jnp.diag(jnp.ones(n - 1), 1) - jnp.diag(jnp.ones(n - 1), -1))
K = K.at[0, 0].set(1.0)
K = K.at[-1, -1].set(1.0)
system = CoupledHamiltonian(K=K, omega=jnp.zeros(n))
q0 = jnp.array([1.0, 0.0, 0.0, 0.0])
p0 = jnp.zeros(n)
times, qs, _ = simulate(system, q0, p0, dt=0.01, steps=1000)
plot_heatmap(times, qs)
PY
```

Extend the system by supplying:

- `TimeModulation` to model time-varying couplings,
- a `forcing` callable for driven lattices,
- the `damping` parameter for lossy circuits,
- diagonal `disorder` to probe fabrication tolerances, or
- `topology_alternation` to toggle Su–Schrieffer–Heeger edge physics.
