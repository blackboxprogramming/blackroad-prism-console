# Block 52 — Reading the Hamiltonian (Eigenmodes & Invariants)

Bring the simulator and the bench onto the same page by letting the Hamiltonian speak. These notes sketch how to extract natural
modes, energy flow, and conserved quantities from state trajectories \((q, p)\) or direct sensor readouts.

---

## A) Eigenmodes — "What are the system's voices?"

For a static Hamiltonian
\[
H = \tfrac{1}{2} p^T M^{-1} p + \tfrac{1}{2} q^T K q,
\]
the stiffness / coupling matrix \(K\) encodes the geometry of the potential energy. Diagonalizing the generalized eigenproblem
delivers the standing-wave patterns and their frequencies.

```python
import numpy as np

def modes(K, M=None):
    if M is None:
        M = np.eye(K.shape[0])
    eigvals, eigvecs = np.linalg.eig(np.linalg.inv(M) @ K)
    freqs = np.sqrt(np.real(eigvals))
    idx = np.argsort(freqs)
    return freqs[idx], eigvecs[:, idx]

freqs, vecs = modes(np.array(K))
for i, f in enumerate(freqs):
    print(f"Mode {i+1}: f = {f:.3f}")
```

Each column in `vecs` is a mode shape. Plot them (bars, line plots, point clouds) to see the chords the system prefers to play.
Cross-check: the spectral peaks in live or simulated data should align with these eigenfrequencies.

---

## B) Instantaneous energy and invariants

Monitor the total energy to verify your integrator respects the Hamiltonian:

```python
E = 0.5 * np.sum(P**2, axis=1) + 0.5 * np.sum(Q * (Q @ K.T), axis=1)
plt.plot(E)
plt.title("Total energy vs time (should be constant if symplectic)")
plt.show()
```

If \(E(t)\) stays flat, the loop is probably stable. Drift hints at step-size issues, unmodeled damping, or logging noise.

---

## C) Spectral fingerprints

A Fourier look at each node reveals which modes are actually active:

```python
from numpy.fft import rfft, rfftfreq

fs = 1 / dt
freq_axis = rfftfreq(Q.shape[0], dt)
spec = np.abs(rfft(Q[:, 0]))
plt.semilogy(freq_axis, spec)
plt.xlabel("Frequency")
plt.ylabel("|Amplitude|")
plt.show()
```

Sharp peaks should coincide with the eigenmodes. Disagreement flags model / experiment mismatch or hidden couplings.

---

## D) Energy transport maps

Visualize how energy rides through the lattice or circuit:

```python
energy_nodes = 0.5 * (Q**2 + (Q @ K.T) * Q)
plt.imshow(energy_nodes.T, aspect="auto", cmap="magma")
plt.xlabel("time")
plt.ylabel("node")
plt.title("Energy per node over time")
plt.colorbar(label="energy")
plt.show()
```

Heatmaps expose reflections, wave packets, and mode-mixing — useful on photonics, LC ladders, or NV fluorescence traces.

---

## E) Automatic conservation discovery (optional math trick)

Let regression guess which linear combinations stay fixed. Stack \(q\) and \(p\), take numeric derivatives, and solve for
coefficients that keep the derivative near zero:

```python
import sklearn.linear_model as lm

def find_conserved(Q, P):
    data = np.hstack([Q, P])
    ddata = np.gradient(data, axis=0)
    model = lm.LinearRegression(fit_intercept=False)
    model.fit(ddata, np.ones(len(ddata)))
    coeffs = model.coef_
    return coeffs / np.linalg.norm(coeffs)

coeffs = find_conserved(Q, P)
print("Approximate conserved combination coefficients:", coeffs)
```

Large coefficients reveal variables tied into conserved quantities (energy, momentum, charge).

---

## F) Why this matters

- **Model ↔ bench parity:** Apply the same tooling to oscilloscope traces and simulation logs.
- **Intuition on energy flow:** Spot which components store or leak energy at a glance.
- **On-ramp to Hamiltonian learning:** Sets up the next leap — inferring \(K\), \(M\), or entire Hamiltonians directly from data.

---

**Next up?** Pick your path:

- (a) Learn Hamiltonians from data (neural / symbolic regression).
- (b) Introduce fractional or complex derivatives for memory-heavy oscillators.
