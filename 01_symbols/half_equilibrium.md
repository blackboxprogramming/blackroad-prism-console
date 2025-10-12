# Symbol Sheet — `half_equilibrium`

**Meaning**: A ledger-aware fixed point where half the modes satisfy conservation while the remainder are allowed controlled dissipation.

## Structure
- **Decomposition**: Split state space into conservative sector `H_c` and dissipative sector `H_d`.
- **Operator Pair**: `P_c` projects onto `H_c`, enforcing invariants; `L_d` steers `H_d` toward equilibrium with tunable rate.
- **Dual**: Co-projection `P_c^*` pulls measurements back into invariant coordinates, ensuring compositional updates.

## Ledgers & Safety
- Total energy ledger records invariant energy in `H_c` plus tracked dissipation budget in `H_d`.
- Perturbations in `H_d` remain bounded if dissipation rate respects Lipschitz constraints from BLOCK_56.

## Cross-Links
- Guides NV Sensor calibration where magnetometer axes stay fixed while per-pixel PLLs adapt (`H_c` fixed bias, `H_d` PLL state).
- Supports Hamiltonian lattice experiments where edge modes are preserved (conservative) while bulk relaxes for noise suppression.
