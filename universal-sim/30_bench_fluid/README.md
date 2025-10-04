# Fluid Benchmark (SPH/FLIP)

This directory houses the reference fluid solver setup. Scripts mirror the solids
workflow to keep outputs aligned for comparison.

## Included files

- `run_sph.py` – PySPH/DualSPHysics-style driver (template with placeholders).
- `run_flip.py` – Taichi-FLIP skeleton for grid-based approaches.

## Workflow

1. Install solver dependencies (example for PySPH):
   ```bash
   pip install pysph numpy pandas meshio
   ```
2. Configure particle spacing, kernel choice, viscosity model, and boundary conditions
   inside the script of choice.
3. Launch the baseline:
   ```bash
   python run_sph.py --output runs/20240229_120102_baseline
   ```
4. Ensure diagnostics include free-surface height grids, velocity fields, and pressure
   snapshots at 500 Hz (or interpolated).
5. Re-run for prompt variants, adjusting viscosity, gravity tilt, or floor friction via
   CLI overrides.

Outputs should include:

```
meshes/               # optional surface meshes
fields/               # HDF5 or NPZ velocity/pressure arrays
free_surface.csv      # height field per timestamp
metadata.json
```
