# Ternary Quantum Consciousness (v3)

<!-- BADGES START -->

[![Deploy](https://github.com/blackboxprogramming/BlackRoad/actions/workflows/deploy-quantum.yml/badge.svg)](../../actions/workflows/deploy-quantum.yml)
[![CodeQL](https://github.com/blackboxprogramming/BlackRoad/actions/workflows/codeql.yml/badge.svg)](../../actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/blackboxprogramming/BlackRoad/badge)](https://securityscorecards.dev/viewer/?uri=github.com/blackboxprogramming/BlackRoad)

<!-- BADGES END -->

Interactive qutrit lab: Lindbladian dynamics (γφ, γrel), von Neumann entropy S(ρ), selectable observables (Pauli-like/Gell-Mann), Hamiltonian editor, session recording + CSV, barycentric visualization.

Pair the UI with the upgraded `lucidia-quantum` CLI to script experiments across
TorchQuantum, Pennylane, or Qiskit. Invoke `lucidia-quantum --list-backends` to
check available simulators before exporting QASM or running batched training.

## Run

Open `apps/quantum/ternary_consciousness_v3.html` in a browser (no build step required).

- Keyboard: Space=Play/Pause, R=Reset, M=Measure, 1–4=Presets
- Sliders + selects drive state, evolution model, and observables.

## Math

- S(ρ) = −Tr(ρ log ρ) (computed via invariants ⇒ eigenvalues)
- Purity P = Tr(ρ²)
- Lindblad: ρ̇ = −i[H,ρ] + Σ_k (L_k ρ L_k† − ½{L_k†L_k, ρ})
- Dephasing via projectors; relaxation via ladder-like L_k.

## Files

- `apps/quantum/ternary_consciousness_v3.html` — standalone app
- `.github/workflows/deploy-quantum.yml` — CI/CD to server via rsync

_Last updated on 2025-09-12_
