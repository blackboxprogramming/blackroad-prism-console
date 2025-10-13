# Universal Simulation Starter

This scaffold mirrors the multiphysics benchmarking plan so you can wire in Genesis generation and downstream solvers quickly.

## Layout
- `00_spec/`: scenario definition and acceptance criteria.
- `10_genesis/`: prompt, configuration, and run script for Genesis.
- `20_bench_solid/`: solid mechanics benchmark entrypoint (e.g., Taichi-MPM, FEniCS, SOFA).
- `30_bench_fluid/`: fluid benchmark entrypoint (e.g., DualSPHysics, PySPH, Taichi-FLIP).
- `40_compare/`: metrics + plotting utilities for comparing outputs.
- `90_reports/`: reporting template for summarizing each run.

Artifacts are expected in `artifacts/` once the scripts are executed. Adjust the paths if your workflow differs.

## Quickstart
```bash
make genesis   # run Genesis generation
make solid     # run the solid benchmark
make fluid     # run the fluid benchmark
make diag      # generate diagnostics (extend as needed)
make variants  # materialise baseline + variant prompt directories
make variants-batch  # compute metrics for baseline + variants
make report-all  # build consolidated Markdown report
```

## Next Steps
1. Replace the stubs in `run_genesis.py`, `run_mpm.py`, and `run_sph.py` with real solver integrations.
2. Feed your solver outputs into the metric helpers to quantify differences.
3. Capture qualitative evidence (screenshots, plots) and document in the report template.
