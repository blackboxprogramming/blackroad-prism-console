# BLOCK 57 — NV Sensor v2: Vector Magnetometry + Imaging

**[FACT]** Single NV centers provide scalar Zeeman shifts; full vector fields demand coordinated bias control and fast demodulation.
**[THOUGHT]** Rotate bias directions while solving per-pixel phase-locked loops so every frame reconstructs `\mathbf{B}(x,y)` in real time.
**[NOVELTY ANGLE]** Treat the imaging pipeline as a ledger-aware inverse problem, enforcing conservation across bias rotations and PLL updates.

## Spec / Steps
- **Hardware Stack**:
  - Install a 3-axis Helmholtz pair (or rotating platform) around the diamond to step bias orientation along `\hat{x}`, `\hat{y}`, and `\hat{z}`.
  - Shield with a lightweight enclosure to suppress ambient field drift.
  - Attach a GPU-accelerated sCMOS/USB3 monochrome camera aligned to the NV layer.
- **Acquisition Loop**:
  - Sequence bias orientations; capture ODMR spectra per pixel.
  - Run a GPU kernel implementing per-pixel PLLs to lock onto resonance frequency in 10–30 fps windows.
  - Solve a least-squares system per pixel combining the three projections into `B_x`, `B_y`, `B_z`.
- **Software Targets**:
  - Notebook in `03_code/analysis/` for calibration curves and ledger checks.
  - Data logged in `05_data/nv_sensor_v2/` with metadata for bias currents and temperature.
  - Live visualization scripts output vector-field animations into `06_figures/nv_sensor_v2/`.
- **Experiments**:
  - Track phantom currents; verify conservation by integrating `\nabla\cdot \mathbf{B}` over the field.
  - Capture EMG bursts and demonstrate responsive vector plots.

## Artifacts
- Code: acquisition and reconstruction prototypes (Python + CUDA) in `03_code/analysis/nv_sensor_v2/`.
- Data: bias sweeps and PLL logs stored via DVC in `05_data/nv_sensor_v2/`.
- Figures: live and archived vector-field movies under `06_figures/nv_sensor_v2/`.

## Risks & Next
- **Risks**: thermal drift in bias coils, PLL divergence under low SNR, GPU bandwidth limits.
- **Next**: finalize BOM in `04_hardware/nv_sensor_v2/` and script calibration routines that validate ledger conservation before live demos.
