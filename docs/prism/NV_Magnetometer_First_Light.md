# Prism Console NV Magnetometer Bring-Up — Blocks 34–36

These blocks close the build loop for the single-sensor NV magnetometer: align the optics, calibrate the PLL-to-field conversion, and keep a live risk log as you work.

## BLOCK 34 — Laser / Optics Alignment Checklist ("First Light")

**Goal:** Obtain visible red fluorescence from the diamond and a clean signal on the photodiode before introducing microwaves or lock-in detection.

### A) Physical setup
- Mount all hardware on a rigid base (e.g., thick plywood with black felt) to suppress vibration.
- Fix the beam height between approximately 50–70 mm and keep every optic on that line.
- Secure the diamond holder using a 3D-printed clamp or a small dab of optical grease on a mirror mount to prevent slipping.

### B) Alignment steps
1. Power the laser at low current. Use an IR card or fluorescent paper to view the spot and wear proper goggles.
2. Collimate then focus: pass the beam through a collimating lens followed by an asphere or microscope objective to focus into the diamond's top face.
3. Watch for back-reflection. Ensure the weak reflection heads back toward the source and block it to avoid feedback.
4. Look for red fluorescence. Place a white card or a phone camera with a 650 nm long-pass filter near the diamond to confirm the reddish glow.
5. Collect light. Position a collection lens at 90° or use back-reflection through a dichroic, routing the light through a 650–800 nm filter onto the photodiode.
6. Measure the DC level. Expect roughly 0.1–3 V DC from the transimpedance amplifier (TIA); moving a small magnet should already cause ppm-level flicker prior to microwave excitation.
7. Enclose the optical path. Add cardboard or 3D-printed baffles to eliminate ambient light and verify the baseline stays stable for at least a minute (less than 1% drift).

### Quick optics hacks
- Repurpose inexpensive webcams without IR filters as alignment cameras.
- Use black electrical tape with a 1 mm pinhole as an ad-hoc spatial filter.
- Insert a polarizer—NV fluorescence is weakly polarized, so rotate for maximum signal.

## BLOCK 35 — Magnetometer Calibration Recipe (PLL → B Field)

**Goal:** Convert the PLL's tracked microwave frequency into a magnetic field magnitude (mT or µT).

1. **Reference bias:** Set the coils to 0 mA and record the locked frequency \(f_0\).
2. **Increment field:** Increase current \(I\) in known steps (e.g., 0.1 A) to generate \(\Delta B \approx \mu_0 n I / r\) for a Helmholtz pair.
3. **Record frequency shift:** Log the PLL frequency \(f(I)\) at each step.
4. **Fit slope:** Perform a linear fit \(\Delta f = \kappa \Delta B\). A slope near 2.8 MHz/mT indicates good alignment; smaller slopes point to off-axis components (treat as a vector projection or adjust alignment).
5. **Zero-offset correction:** Store \(f_0\) as the zero-field baseline.
6. **Runtime conversion:** Calculate the field as \(B\;[\text{mT}] = (f_{\text{PLL}} - f_0)/\kappa\).
7. **Optional cross-check:** Validate against a Hall probe or the known Earth field (~50 µT).

*Tip:* Sweep the coil current in both directions (+I and −I) and average to cancel hysteresis and coil offsets.

## BLOCK 36 — Risk Log / Re-Assessment Gates

**Purpose:** Prevent burnout or safety incidents by codifying pauses when conditions are not yet met.

| Gate | Verify before proceeding | If unmet, pause and fix |
| --- | --- | --- |
| G1 — Laser on bench | Laser output < 100 mW, protective eyewear on, beam enclosed. | Build housing or interlock first. |
| G2 — Fluorescence visible | Red glow stable > 60 s, photodiode (PD) > 0.1 V DC. | Re-align optics or improve collection. |
| G3 — MW coupling | ODMR dips ≥ 1% contrast visible. | Adjust loop position, microwave power, or modulation. |
| G4 — Lock-in SNR | Noise < 0.1% rms at 10 kHz bandwidth. | Improve grounding or reduce laser driver noise. |
| G5 — PLL lock | Frequency tracks bias field linearly without oscillation. | Retune loop gains and verify sign. |
| G6 — Integration | Agent + sensor loop runs > 5 min without drift; data logged. | Add logging or thermal stabilization. |
| G7 — Reflection | A peer reviews safety & data before scaling. | External review often spots blind spots. |

### Failure modes to expect
- **Optical heating:** NV resonance drifts; reduce laser power or add a heatsink.
- **Electronic hum:** Break ground loops or power the TIA from batteries.
- **Motivation drop:** Celebrate incremental wins (first dip, first lock, first field map).

### Back-off plan
When hardware debugging stalls, return to the simulation loop; model the subsystem until the physical fix is clear.

---

With Gate G6 complete, the loop is fully operational—light excitation, microwave spin physics, digital control, and a Hamiltonian-style agent steering itself. From here you can scale to multiple sensors, enhance optics, or integrate Hamiltonian learning into firmware.

