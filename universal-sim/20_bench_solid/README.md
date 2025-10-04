# Solid Benchmark (MPM/FEM)

Use this folder to reproduce the reference soft-body dynamics with a classical solver.
Two starter scripts are provided:

- `run_mpm.py` – Taichi-MPM oriented workflow (material point discretization).
- `run_fem.py` – FEniCS-style finite element setup.

Pick one path and document your choice in the run metadata. Both scripts share helper
functions for exporting meshes and stresses.

## Quick Steps

1. Install dependencies (example for Taichi-MPM):
   ```bash
   pip install taichi taichi-mpm meshio numpy
   ```
2. Update solver parameters in `run_mpm.py` (particle spacing, grid resolution,
   material parameters).
3. Run the baseline:
   ```bash
   python run_mpm.py --output runs/20240229_120102_baseline
   ```
4. Export snapshots at 0.4, 0.8, 1.2 s (scripts do this automatically). Verify the
   output VTK files appear under `meshes/` and stresses under `diagnostics/`.
5. Repeat for generalization variants by passing overrides (see `--help`).

Outputs mirror the generative run layout to simplify comparisons.
