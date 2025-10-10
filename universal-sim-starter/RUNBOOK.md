# Universal Sim Starter Runbook

Short, bossy reminders so you can run the scaffold without spelunking notes.

## Baseline Loop
1. `make mpm-core` – run the solid benchmark with adaptive CFL timesteps.
2. `make pysph` *(or `make pysph-real` when you want the heavier SPH stack).* 
3. `make check` – asserts the baseline via `python3 40_compare/check_thresholds.py`.
4. `make variants` – then, for each variant:
   ```bash
   python3 40_compare/check_thresholds.py --variant=lower_viscosity
   python3 40_compare/check_thresholds.py --variant=tilt_gravity
   ```
5. `make batch && make report` – roll up the results for sharing.
6. `make energy` – open the CFL log (`20_bench_solid/outputs/logs/energy.csv`).

## Diagnostics Cheatsheet
- `python3 40_compare/check_thresholds.py --root <path>` – repoint the checker at
  another workspace.
- Inspect `20_bench_solid/outputs/logs/energy.csv` (dt, vmax, cfl_dt, dx per step)
  whenever stability looks off.
- Stash per-variant artifacts under `10_genesis/outputs_<variant>` so checks don’t
  trip over missing directories.
