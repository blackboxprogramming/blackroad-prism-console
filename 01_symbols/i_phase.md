# Symbol Sheet — `i_phase`

**Meaning**: Imaginary phase rotation that converts dissipative flow into conservative oscillation while keeping the conservation ledger explicit.

## Structure
- **Domain**: operators that generate time evolution with well-defined ledgers (mass, energy, entropy).
- **Action**: multiplies the generator by `i`, shifting eigenvalues along the imaginary axis to encode oscillatory behavior.
- **Dual**: The adjoint action `(-i)G^†` keeps spectral symmetry when the ledger demands Hermitian structure.

## Ledgers & Safety
- Preserves norm if the base generator is anti-Hermitian.
- Converts monotone entropy production into phase rotation but requires an auxiliary entropy tracker to ensure bounded input.

## Cross-Links
- Appears in BLOCK_56 safe algebra when promoting diffusion generators to dispersive memory operators.
- Use with Caputo derivatives to combine memory and oscillation while respecting conservation constraints.
