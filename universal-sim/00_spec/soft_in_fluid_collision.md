# Soft-in-Fluid Collision Pilot — Execution Protocol

This document promotes the scenario outline into a runnable protocol. Treat it as the
single source of truth for acceptance criteria, run order, and metadata. Numbers are
locked unless you intentionally branch the experiment.

---

## 1. Success Criteria

Track the following for every run (baseline + variants). A run is successful when all
hard targets are met, and soft targets show sane trends.

| Metric | Target |
| --- | --- |
| Deformation error (Hausdorff median) | ≤ 5–10 mm at t = 0.4, 0.8, 1.2 s |
| Stress L2 error (von Mises) | Within 12 % of FEM reference |
| Contact timing error (A–floor, A–B) | ≤ 10 ms |
| Fluid free-surface MSE | Matches SPH grid within tolerance; peak height ±7 % |
| Fluid mass drift | ≤ 0.5 % (fail-fast at 1 %) |
| Stability | No negative Jacobians; energy monotone with viscous damping |
| Throughput | < 2 h wall-clock per 1.2 s sim on 24–48 GB GPU |

Also log token usage (if the sim engine uses LLM prompts) and solver iterations per
step to judge computational cost.

---

## 2. Hardware & Software Prerequisites

- **Compute**: Single workstation or cloud VM with one NVIDIA GPU (≥ 24 GB VRAM) or
  Apple Silicon with MPS. Keep hardware constant across runs.
- **Generative simulator**: Genesis (or equivalent) with natural-language scene spec
  + Python SDK enabling programmatic parameter sweeps.
- **Solid benchmark**: Taichi-MPM or FEniCS (choose one), configured for Neo-Hookean
  materials. Minimum 150k material points (MPM) or DOF (FEM).
- **Fluid benchmark**: DualSPHysics, PySPH, or Taichi-FLIP with Wendland kernel, target
  viscosity using artificial viscosity or sub-stepping. Particle spacing ≤ 4 mm.
- **Python stack**: Python ≥ 3.10, `numpy`, `scipy`, `pandas`, `meshio`, `trimesh`,
  `matplotlib`. Install via `pip install -r requirements.txt` (create locally as needed).
- **Optional physical experiment**: Acrylic tank (0.6×0.4×0.6 m), 50/50 glycerin-water,
  silicone bodies (two stiffness levels), synchronized camera.

Record package versions in `universal-sim/run_metadata.yaml` for each run (create file
per run).

---

## 3. Scenario Definition (Immutable)

- **Domain**: Tank 0.6 m × 0.4 m × 0.6 m; walls enforce no-slip.
- **Gravity**: −z direction, magnitude 9.81 m/s².
- **Fluid**: Newtonian, density ρ_f = 1150 kg/m³, dynamic viscosity μ = 0.015 Pa·s.
- **Soft body A**: Sphere, radius 0.05 m, density ρ_A = 1200 kg/m³, Neo-Hookean with
  E = 80 kPa, ν = 0.49; initial position (0, 0, 0.45 m).
- **Soft body B**: Ellipsoid with axes (0.06, 0.04, 0.04) m, density ρ_B = 1050 kg/m³,
  Neo-Hookean with E = 30 kPa, ν = 0.49; initial position (0.03 m, 0, 0.50 m).
- **Initial velocities**: Zero.
- **Contacts**: Frictionless between solids; solid-fluid two-way coupling; rigid tank
  bottom.
- **Outputs**: 3D fields at 500 Hz for 1.2 s (solid meshes, velocity, pressure,
  von Mises stress, interface data) + 60 FPS video.

---

## 4. Run Plan

### 4.1 Dry Run (0.2 s)
1. Clone or update the simulator repos. Verify GPU visibility.
2. Populate `10_genesis/config.baseline.yaml` using the template (see Section 5).
3. Execute the Python driver (see `10_genesis/README.md`) with `sim_duration=0.2` and a
   coarse grid/particle count (target < 5 min).
4. Confirm outputs exist: sample meshes, velocity field slices, video frames, solver
   logs, and metadata JSON.
5. Check quick diagnostics:
   - No unit mismatches (gravity direction, densities, etc.).
   - Mass drift < 0.5 % over 0.2 s.
   - No solver divergence/warnings.
6. If failures occur, document in `90_reports/dry_run_notes.md` and fix before continuing.

### 4.2 Baseline Run (1.2 s)
1. Lock random seed and note GPU driver version.
2. Increase spatial resolution until CFL < 0.4 for both fluid and solids; record counts.
3. Run the full 1.2 s generative simulation. Store raw outputs under
   `10_genesis/runs/YYYYMMDD_HHMMSS_baseline/`.
4. Generate quicklooks (pressure slice, velocity magnitude, stress iso-surface).
5. Record runtime, average solver iterations, peak memory, token usage.
6. Archive config + prompt in the run folder (read-only thereafter).

### 4.3 Classical Benchmarks
- **Solids**: Configure `20_bench_solid/run_mpm.py` (template provided) with mesh/MPM
  settings matching the baseline. Export displacement, stress, and contact impulses at
  the same timestamps (0.4, 0.8, 1.2 s).
- **Fluid**: Configure `30_bench_fluid/run_sph.py` to match fluid properties and
  boundary motions. Export free-surface height grid, velocity, and pressure fields.
- **Coupling**: If solvers are separate, run in staggered mode:
  1. Feed solid surface velocities into fluid solver as moving no-slip BC.
  2. Feed fluid tractions back into solids as surface loads each substep.
  3. Iterate until both converge within tolerance (≤ 3 passes per step).

### 4.4 Generalization Sweeps
Run the generative simulator four more times with prompt/config tweaks:
1. **Viscosity sweep**: μ = 0.010 Pa·s and μ = 0.030 Pa·s.
2. **Swap stiffness**: Exchange E values of bodies A and B.
3. **Tilted gravity**: 5° toward +x (gravity vector rotated accordingly).
4. **Floor friction**: Add kinetic friction μ_k = 0.05 for solid-floor contact.

Record each run under `10_genesis/runs/<timestamp>_<variant>/` and replicate matching
benchmark runs where applicable.

### 4.5 Diagnostics & Reporting
1. Use the scripts in `40_compare/` to compute metrics (Hausdorff, stress L2, mass
   drift, splash MSE).
2. Plot energy vs. time, CFL numbers, contact impulses, and free-surface heights.
3. Populate `90_reports/one_pager_template.md` with scenario ID, seed, hardware, six
   thumbnails, and metric tables.
4. Store rendered video snapshots in `10_genesis/runs/.../media/` and reference them in
   the report.

---

## 5. Genesis Config Template

Create `10_genesis/config.baseline.yaml` from the snippet below (replace placeholders):

```yaml
scenario_id: soft_in_fluid_collision_v1
random_seed: 20240101
sim_duration: 1.2
output_rate_hz: 500
video_fps: 60
engine:
  name: genesis
  version: "<engine-version>"
  device: cuda
  precision: fp32
  max_cfl: 0.4
  checkpoint_interval: 0.05
scene:
  domain: {size: [0.6, 0.4, 0.6], boundary: no_slip}
  gravity: {vector: [0.854, 0.0, -9.743]} # overwrite for variants; default [-0.0, 0.0, -9.81]
  fluid:
    density: 1150
    viscosity: 0.015
    discretization: {type: grid, resolution: [180, 120, 180]}
  solids:
    - id: body_A
      shape: sphere
      radius: 0.05
      position: [0.0, 0.0, 0.45]
      density: 1200
      material: {model: neo_hookean, youngs_modulus: 80000, poisson_ratio: 0.49}
    - id: body_B
      shape: ellipsoid
      axes: [0.06, 0.04, 0.04]
      position: [0.03, 0.0, 0.50]
      density: 1050
      material: {model: neo_hookean, youngs_modulus: 30000, poisson_ratio: 0.49}
contacts:
  solid_solid: {friction: 0.0}
  solid_floor: {friction: 0.0}
  fluid_solid: {coupling: two_way, stabilization: implicit}
outputs:
  fields: [velocity, pressure, vorticity, stress_von_mises]
  meshes: true
  interface: true
logging:
  diagnostics: [cfl, iterations, residuals, energy, mass]
  report_interval: 0.01
```

> **Note**: Update the gravity vector or friction coefficients per variant. Store the
exact prompt used in `10_genesis/prompt.txt` alongside the config.

---

## 6. Benchmark Alignment Checklist

- Match time steps (`Δt`) between generative sim and benchmarks; if sub-stepping is
  required, output interpolated fields at the 500 Hz schedule.
- Ensure material parameters and densities match within < 0.1 %.
- Use identical initial positions and zero initial velocities.
- Validate mesh quality: minimum element quality > 0.3 (FEM) or particle spacing
  uniformity < 5 % (MPM/SPH).
- Align coordinate frames (z-up). Document any rotation matrices applied.

---

## 7. Data Management

- Store raw simulator outputs in compressed archives (`.tar.zst`) once metrics are
  computed; keep checksums in `SHA256SUMS.txt`.
- Use `run_metadata.yaml` to capture:
  ```yaml
  run_id: <timestamp_label>
  hardware:
    gpu: "NVIDIA RTX 6000 Ada"
    driver: "535.104"
    cpu: "AMD Threadripper 7950X"
    ram_gb: 128
  software:
    genesis: "0.5.1"
    taichi_mpm: "1.5.0"
    dualsphysics: "5.2"
  seed: 20240101
  notes: "baseline resolution tuned for CFL 0.35"
  ```
- Keep derived CSVs/plots under `40_compare/derived/` to avoid polluting raw data.

---

## 8. Fail-Fast Heuristics

| Symptom | Action |
| --- | --- |
| Negative volumes/Jacobians | Reduce time step, add artificial damping, or refine mesh |
| Fluid mass drift > 1 % | Lower CFL target or increase resolution |
| Contact chatter | Increase constraint damping or use compliant penalty |
| Solver divergence | Capture logs, reduce nonlinearity tolerance, or warm-start |

Document every intervention in the run report for reproducibility.

---

## 9. Stretch Goals (Optional)

Attempt only after baseline + variants succeed:
- Add thermal coupling or plastic yield to one solid.
- Switch fluid to Carreau–Yasuda rheology (update benchmarks accordingly).
- Run inverse design: ask engine to recover material stiffness from observed video.
- Compose prompts (e.g., "body A rebounds without touching floor"). Record extra
  configs under `10_genesis/runs/<timestamp>_stretch/`.

---

## 10. Change Log

Keep this file immutable during the study. If alterations are needed, duplicate it with
an incremented version suffix and capture the rationale in `90_reports/CHANGELOG.md`.
