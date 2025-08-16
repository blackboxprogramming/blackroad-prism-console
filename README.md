# BlackRoad Prism Console

This repository powers the BlackRoad Prism console and a Vite/React site under `sites/blackroad`.

## Quickstart

Install dependencies:

```bash
npm ci
(cd sites/blackroad && npm i --package-lock-only)
```

## Development

```bash
cd sites/blackroad
npm run dev
```

## Build

```bash
cd sites/blackroad
npm run build
```

## Tests

```bash
npm test
```

Additional operational docs live in the [`docs/`](docs) folder.

## Math Labs

### Uncertainty & Geodesics

- **/uncertainty**: Pick observable packs:
  - *Spin-1 (SU(2))*: Sx, Sy, Sz (+ S±). Shows exact spin-1 sum-of-variances bound ∑Var ≥ 1.
  - *Weyl qutrit (d=3)*: X, Z and their Hermitian parts (position/momentum-like).
  - Always shows the full **Robertson–Schrödinger** inequality for (A,B) and pairwise bounds for (A,B,C).

- **/geodesic**: Compute Fubini–Study distance `d_FS = arccos(|⟨ψ|φ⟩|)` and sample the **CP² geodesic** points between |ψ₀⟩ and |ψ₁⟩.
