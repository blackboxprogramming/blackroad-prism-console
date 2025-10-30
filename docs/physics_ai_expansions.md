# Physics-Inspired Agent Expansions

This note expands two of the sketches from Blocks 19 and 20 with concrete implementation detail.

## 1. Minimal Hamiltonian-First Agent Simulation

Goal: prototype the Hamiltonian-first agent using a differentiable, symplectic integrator so policies are "programs as Hamiltonians" that can be optimized end-to-end.

### 1.1 Phase-Space Model
- **Latent state**: \(x = (q, p) \in \mathbb{R}^{2n}\) with generalized coordinates \(q\) and momenta \(p\).
- **Hamiltonian**: \(H_\theta(q, p, u, s) = T_\theta(p) + V_\theta(q) + H_{\text{sense}}(q, s) + H_{\text{ctrl}}(q, p, u)\).
  - \(T_\theta(p)\): kinetic term (e.g., \(p^\top M^{-1} p / 2\)).
  - \(V_\theta(q)\): learned potential encoding goals/rewards.
  - \(H_{\text{sense}}\): sensor-induced tilts, updated each step from observations \(s_t\).
  - \(H_{\text{ctrl}}\): control knobs determined by action signal \(u_t\).

### 1.2 Dynamics Integrator
Use a symplectic integrator (leapfrog/Stormer-Verlet) for numerical stability and energy behaviour:
1. Half-step momentum update: \(p_{t+\frac{1}{2}} = p_t - \frac{\Delta t}{2} \nabla_q H(q_t, p_t, u_t, s_t)\).
2. Full-step position update: \(q_{t+1} = q_t + \Delta t \nabla_p H(q_t, p_{t+\frac{1}{2}}, u_t, s_t)\).
3. Half-step momentum update: \(p_{t+1} = p_{t+\frac{1}{2}} - \frac{\Delta t}{2} \nabla_q H(q_{t+1}, p_{t+\frac{1}{2}}, u_t, s_t)\).

### 1.3 Control Regimes
- **Adiabatic planning**: schedule \(H_{\text{ctrl}}\) parameters so the system stays near the instantaneous minimum of \(H\). Implement via smooth interpolation of control knobs (e.g., cubic splines over horizon).
- **Pulse/react**: allow impulsive adjustments by adding short-lived Gaussian-enveloped terms in \(H_{\text{ctrl}}\) that respond to constraint violations detected from sensors.

### 1.4 Learning Loop
1. **Rollout** the dynamics with the symplectic integrator for horizon \(T\).
2. **Cost functional**: \(J = \sum_{t=0}^{T-1} [\ell(q_t, s_t) + \lambda E_t]\) where \(\ell\) measures task loss and \(E_t = H(q_t, p_t, u_t, s_t)\) is an energy/action penalty.
3. **Differentiate** \(J\) w.r.t. parameters \(\theta\) and control schedule coefficients via automatic differentiation through the integrator.
4. **Update** using optimizer (Adam, natural gradient). Constrain updates to preserve symplectic structure (e.g., parameterize \(M\) via Cholesky to keep positive-definite).

### 1.5 Pseudocode Sketch
```python
state = init_state()
params = init_params()
controls = init_control_schedule()
for step in range(train_steps):
    rollout = []
    q, p = state
    for t in range(horizon):
        s_t = sense_environment(q)
        u_t = control_signal(controls, t, s_t)
        grads = gradients_of_H(q, p, u_t, s_t, params)
        q, p = symplectic_step(q, p, grads, dt)
        rollout.append((q, p, s_t, u_t))
    loss = compute_loss(rollout, params)
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()
```

### 1.6 Extensions
- **Hybrid quantum-classical**: map \(H\) parameters to analog hardware (oscillator networks) and use digital gradients to tune them.
- **Safety filters**: include barrier functions in \(V_\theta\) to keep trajectories within constraints.
- **Interpretability**: log instantaneous energy decomposition (kinetic vs potential vs control) to understand decisions.

## 2. NV-Center Quantum Sensing Bench: Parts & Signal Chain

### 2.1 Core Components
| Function | Suggested Part | Notes |
| --- | --- | --- |
| Diamond sample | 3 mm CVD diamond with \(\sim\)1 ppm NV ensemble (Element Six or equivalent) | Prefer [100] orientation, polished faces.
| Excitation laser | 532 nm DPSS laser, 100–300 mW (Coherent Compass, CNI MGL series) | Include AOM or mechanical shutter for gating.
| Beam conditioning | Mirrors, dichroic (reflect 532 nm / transmit 637–800 nm), beam expander, objective (NA \(\geq\) 0.3) | Maintain alignment stability.
| Microwave source | Synthesizer covering 2.6–3.2 GHz (Rohde & Schwarz SMB100A or Mini-Circuits PNR series) | Add IQ modulation input for frequency sweeps.
| Microwave delivery | Copper loop or coplanar waveguide near diamond; optional amplifier (1–5 W) | Ensure impedance matching.
| Magnetic bias | Helmholtz coil pair with current driver (±0.5 A) | Add Hall probe for calibration.
| Photodetection | Si photodiode (Thorlabs PDA36A) or sCMOS camera for wide-field | Integrate low-noise transimpedance.
| Signal processing | Lock-in amplifier (SR830) or FPGA/DAQ (NI USB-6363) running software lock-in | Synchronize with microwave modulation.
| Control & acquisition | PC with Python/LabVIEW; include temperature monitor (thermistor + PID if needed) | Automate sweeps and logging.

### 2.2 Signal Chain Overview
1. Laser excites NV centers; fluorescence (637–800 nm) carries spin-state information.
2. Microwave source drives spin transitions; amplitude or frequency modulated at \(f_\text{mod}\).
3. Photodetector captures fluorescence; signal contains modulation at \(f_\text{mod}\) proportional to resonance contrast.
4. Lock-in amplifier demodulates fluorescence, yielding ODMR signal with high SNR.
5. Data acquisition layer logs demodulated signal while sweeping microwave frequency or magnetic field.
6. Calibration routines translate resonance shift \(\Delta f\) into magnetic field via \(\Delta f = \gamma_e B / 2\pi\) (\(\gamma_e = 28\) GHz/T).

### 2.3 Suggested Experiments
- **ODMR baseline**: sweep 2.7–3.1 GHz, observe dips at \(m_s = 0 \leftrightarrow \pm1\) transitions.
- **Zeeman shift**: apply incremental magnetic field; fit slope to verify gyromagnetic ratio.
- **Sensitivity measurement**: inject known AC field via calibration coil; compute noise floor in nT/\(\sqrt{\text{Hz}}\).
- **Wide-field imaging upgrade**: replace photodiode with camera, perform per-pixel lock-in digitally.

### 2.4 Integration with ML Stack
- Stream demodulated data into an online learner that estimates and subtracts environmental drifts.
- Use transformer-based denoisers conditioned on coil currents for adaptive filtering.
- Couple with Hamiltonian-first control to adjust coil currents, keeping NV ensemble in optimal bias.

---
These expansions should make the concepts execution-ready while staying modular enough to plug into broader "physics-as-inductive-bias" tooling.
