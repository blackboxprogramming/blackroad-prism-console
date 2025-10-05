# Universal Equation Simulator: Soft-in-Fluid Collision Pilot

This scaffold turns the high-level experiment brief into a reproducible protocol for
probing generative/unified simulators (e.g., Genesis) against classical CFD/solid
benchmarks. Start here to understand the repository layout, run order, and reporting
expectations.

## Folder map

- `00_spec/` – immutable scenario specification and acceptance criteria.
- `10_genesis/` – prompts, configs, seeds, and exported fields from the generative run.
- `20_bench_solid/` – scripts + meshes for the solid benchmark (MPM/FEM).
- `30_bench_fluid/` – scripts/configs for the fluid benchmark (SPH/FLIP).
- `40_compare/` – analysis notebooks/scripts, shared metrics, plots, and diagnostics.
- `90_reports/` – one-pagers summarizing each run with thumbnails and metric tables.

Keep raw outputs read-only once archived; track derived products in `40_compare/`.

## Quickstart

1. **Review the spec** in `00_spec/soft_in_fluid_collision.md` and confirm hardware.
2. **Dry-run the generative sim** using the template in `10_genesis/README.md`.
3. **Run baselines** for solids and fluid with the scripts in `20_bench_solid/` and
   `30_bench_fluid/` (stubs provided; add solver-specific commands).
4. **Compare metrics** using `40_compare/hausdorff_mass_metrics.py` and notebooks.
5. **Summarize** in `90_reports/one_pager_template.md`.

## Conventions

- Store timestamps in seconds, fields in SI units.
- Use ISO 8601 for run start times and `YYYYMMDD_HHMMSS` for folder suffixes when
  archiving multiple runs.
- Record solver versions, GPU model, VRAM, driver, and random seeds in each run folder.

## Extending

Add additional scenarios under `universal-sim/<scenario-name>/` with the same layout.
For stretch goals, fork this scaffold or duplicate the folder with updated specs and
prompt variants.
