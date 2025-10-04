# Genesis runner wiring notes

This folder houses the thin shims that let the universal simulation starter
invoke your Genesis-based simulations.  The recommended flow is:

1. Configure your Genesis scene as a standalone Python module that exposes a
   `simulate(step_count: int, **kwargs) -> dict` entry point.  The return value
   should contain file paths for any artifacts you want to score
   (e.g. `"point_cloud"`, `"scalar_field"`, `"diagnostics"`).
2. Update `run_genesis.py` to import your module and forward any CLI arguments
   into the simulation entry point.
3. Emit artifacts into a working directory that the comparison scripts can read.
   The loaders in `40_compare/io_utils.py` expect `.ply`, `.npz`, and `.npy`
   outputs but feel free to extend them if your engine produces other formats.
4. Hand the resulting files to the metric runners (see
   `40_compare/demo_end_to_end.ipynb` for a quick sanity check template).

Once this wiring is in place you can drop Genesis alongside other solvers and
produce side-by-side reports in `90_reports/`.
