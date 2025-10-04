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
