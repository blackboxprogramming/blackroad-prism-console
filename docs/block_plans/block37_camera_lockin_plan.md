# Block 37: Wide-Field Camera Lock-In Plan

## Objective
Create a wide-field ODMR imaging pipeline that delivers real-time magnetic field contrast maps at 10 frames per second, enabling per-pixel resonance tracking and serving as the foundation for subsequent GPU acceleration and vector magnetometry upgrades.

## System Overview
1. **Optical Path**
   - Replace point collection optics with a telecentric lens to maintain uniform magnification over a ~1 mm field-of-view.
   - Deploy an sCMOS monochrome camera optimized for 700–800 nm fluorescence with >60% quantum efficiency and <2 e- read noise.
   - Integrate adjustable excitation homogenizer (e.g., engineered diffuser) to flatten the pump beam profile across the diamond surface.
2. **Microwave Excitation**
   - Use an antenna delivering homogeneous MW fields over the imaging area.
   - Provide fast TTL gating synchronized with camera exposures to enable frame-by-frame microwave on/off modulation.
3. **Synchronization & Control**
   - FPGA or MCU handles trigger distribution: alternating MW ON/OFF exposures, camera trigger, and optional frequency hop pulses.
   - Host PC receives frames via USB3/GigE; GPU optional for accelerated processing.

## Data Acquisition Pipeline
1. Configure the camera for rolling sequence of paired frames: Frame 2k (MW ON) followed by Frame 2k+1 (MW OFF).
2. Buffer at least 20 paired frames (2 seconds) on the host to smooth jitter while sustaining 10 fps effective rate.
3. Apply dark-frame subtraction and flat-field correction using calibration maps captured daily.
4. Compute per-pixel contrast: `C = (F_off - F_on) / F_off` with epsilon regularization for low signal regions.
5. Maintain running average and variance per pixel for noise estimates and confidence mapping.

## Per-Pixel PLL Extension
1. For each pixel, maintain a lightweight digital PLL tracking ODMR resonance:
   - Alternate MW frequencies `f0 ± Δf` every other ON frame; reuse OFF frames for baseline normalization.
   - Estimate slope via difference in ON frames; update resonance estimate using proportional-integral loop.
2. Convert frequency shift to magnetic field using calibrated gyromagnetic factor (2.8 MHz/G) and store B(x,y) maps.
3. Implement per-pixel watchdog that re-locks using a coarse sweep if signal drops below threshold.

## Software Architecture
- **Acquisition Layer (Python + C++ bindings)**: wraps camera SDK, exposes async generator yielding corrected frame pairs.
- **Processing Core (NumPy/CuPy kernels)**:
  - Contrast computation kernel optimized for vectorization.
  - Optional GPU version invoked when CUDA device available; fallback CPU path ensures portability.
- **PLL Manager**:
  - Maintains state arrays for resonance frequency, slope, and confidence.
  - Uses Numba/CuPy for per-pixel updates within 1 ms budget per frame pair.
- **Visualization Service**:
  - Streams heatmaps via WebSocket to Prism console UI.
  - Provides toggles for raw contrast, B-field, and confidence overlays.
- **Recording Module**:
  - Writes synchronized video (contrast/B-field) and metadata (frequency setpoints, temperature, timestamps) to disk.

## Calibration & Validation
1. Capture dark/flat-field maps at the start of each session.
2. Validate contrast mode using known static magnet (dipole phantom) and compare against single-pixel ODMR reference.
3. Inject synthetic frequency perturbations via MW source to confirm PLL tracking accuracy (<2 kHz error) over 10-minute intervals.
4. Measure system noise floor by recording with MW detuned; target <1 µT/√Hz per pixel after averaging.

## Deployment Milestones
1. **Milestone 1 – Optical & Acquisition Setup**
   - Install telecentric lens + sCMOS.
   - Achieve stable 20 fps raw acquisition with synchronized MW toggling.
2. **Milestone 2 – Lock-In Contrast Pipeline**
   - Deliver 10 fps contrast map with flat-field correction and live visualization.
   - Demonstrate recording/ playback of contrast video.
3. **Milestone 3 – Per-Pixel PLL Prototype**
   - Implement ±Δf hopping and digital PLL loop on CPU.
   - Validate B(x,y) map accuracy against calibration coil pattern.
4. **Milestone 4 – Performance Optimization**
   - Port heavy kernels to GPU; verify 30 fps sustained on RTX 3060-class GPU.
   - Add automated re-lock routines and confidence visualization.

## Risks & Mitigations
- **Uneven Illumination**: mitigate via diffuser, flat-field correction, and regular calibration captures.
- **Camera Noise & Drift**: select low-noise sCMOS, maintain temperature control, and track baseline offsets per pixel.
- **Synchronization Jitter**: use hardware triggering and verify timing with oscilloscope before full acquisition.
- **Data Throughput Limits**: implement ring buffers and asynchronous IO; test with simulated data prior to hardware arrival.

## Next Steps
- Procure optical components (telecentric lens, diffuser) and sCMOS camera meeting specs.
- Implement acquisition stub that ingests recorded datasets for software development ahead of hardware.
- Schedule integration session to align PLL firmware roadmap with planned MCU offload (Blocks 31 & 33).
