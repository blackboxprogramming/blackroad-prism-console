# Generative Simulation Playbook

This folder holds prompts, configs, driver scripts, and outputs for the generative/unified
simulator (e.g., Genesis). The goal is to go from natural-language spec to reproducible
runs without touching the UI.

## Files

- `prompt.txt` – canonical natural-language request sent to the engine.
- `config.baseline.yaml` – engine configuration for the baseline run.
- `driver.py` – Python harness calling the engine SDK.
- `runs/` – archived outputs (`<timestamp>_<label>/`).

## Workflow

1. **Authorize**: Export any required API tokens (`export GENESIS_TOKEN=...`).
2. **Prepare prompt**: Copy `prompt.template.txt` to `prompt.txt` and edit variants.
3. **Configure**: Duplicate `config.template.yaml` (this repo ships a baseline snippet in
   the spec) and adjust resolution/CFL per hardware.
4. **Run dry test**:
   ```bash
   python driver.py --config config.baseline.yaml --duration 0.2 --label dry_run
   ```
5. **Baseline**:
   ```bash
   python driver.py --config config.baseline.yaml --label baseline
   ```
6. **Variants**: Use `--override` flags (JSON patches) for viscosity, stiffness swaps,
   gravity tilt, or floor friction.
7. **Archive**: After each run, execute `python driver.py --archive runs/<folder>` to
   compress outputs and generate checksums.

Outputs follow the layout:

```
runs/<timestamp>_<label>/
  config.yaml
  prompt.txt
  metadata.json
  fields/
    fluid_velocity_000000.h5
    ...
  meshes/
    body_A_000000.vtk
    ...
  diagnostics/
    energy.csv
    mass.csv
    solver.log
  media/
    render_0000.png
    sim.mp4
```

Document runtime statistics in `metadata.json` (see `driver.py`).
