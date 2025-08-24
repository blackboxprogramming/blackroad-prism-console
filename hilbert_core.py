# Minimal Hilbert-space symbolic core for context-sensitive reasoning.
# Dependencies: numpy
#
# Quickstart:
#   python hilbert_core.py
#
# What you get:
#   • Projectors from basis vectors/subspaces
#   • Density-matrix (pure/mixed) states
#   • Truth degrees via Tr(ρ P)
#   • Lüders update (measurement-as-question)
#   • Tensor product for role/filler binding
#   • Commutator-based order/context effects demo

import numpy as np

# ---------- Linear algebra helpers ----------

def normalize(v: np.ndarray) -> np.ndarray:
    v = np.asarray(v, dtype=np.complex128).reshape(-1)
    n = np.linalg.norm(v)
    if n == 0:
        raise ValueError("Zero vector cannot be normalized.")
    return v / n

def orthonormalize(B: np.ndarray) -> np.ndarray:
    """QR-based orthonormalization for (possibly) non-orthonormal columns."""
    B = np.asarray(B, dtype=np.complex128)
    if B.ndim == 1:
        B = B.reshape(-1, 1)
    Q, _ = np.linalg.qr(B)
    return Q

def projector_from_basis(B: np.ndarray) -> np.ndarray:
    """Return projector onto the column span of B."""
    Q = orthonormalize(B)
    P = Q @ Q.conj().T
    return (P + P.conj().T) / 2  # hermitize for numerical stability

def pure_state(psi: np.ndarray) -> np.ndarray:
    psi = normalize(psi)
    return np.outer(psi, psi.conj())

def mixed_state(states, probs=None) -> np.ndarray:
    """Create a mixed state from state vectors.

    Parameters
    ----------
    states : Iterable[np.ndarray]
        State vectors that will be orthonormalized as a group.
    probs : Iterable[float] | None
        Probability weights for the states. If omitted, a uniform
        distribution is assumed.

    Returns
    -------
    np.ndarray
        Density matrix representing the mixed state.

    Raises
    ------
    ValueError
        If no states are provided, if the probabilities do not match the
        number of states, or if a negative/zero-sum probability is supplied.
    """
    states = list(states)
    if not states:
        raise ValueError("At least one state vector is required")

    states_arr = np.column_stack(states)
    ortho = orthonormalize(states_arr)
    states = [ortho[:, i] for i in range(ortho.shape[1])]

    if probs is None:
        probs = np.ones(len(states), dtype=float)
    else:
        probs = np.asarray(probs, dtype=float)
        if probs.size != len(states):
            raise ValueError("Length of probs must match number of states")
        if np.any(probs < 0):
            raise ValueError("Probabilities must be non-negative")
        total = probs.sum()
        if total <= 0:
            raise ValueError("Sum of probabilities must be positive")
        probs = probs / total

    rho = sum(p * np.outer(s, s.conj()) for s, p in zip(states, probs))
    return (rho + rho.conj().T) / 2

def tensor(*ops) -> np.ndarray:
    out = np.array([[1.0+0j]])
    for op in ops:
        out = np.kron(out, op)
    return out

# ---------- Reasoning primitives ----------

def truth_degree(rho: np.ndarray, P: np.ndarray) -> float:
    """Degree of truth for proposition P in state ρ: Tr(ρP)."""
    return float(np.real(np.trace(rho @ P)))

def luders_update(rho: np.ndarray, P: np.ndarray, eps: float = 1e-12):
    """
    Lüders rule: ρ' = PρP / Tr(PρP).
    Returns (ρ', probability_of_yes).
    """
    M = P @ rho @ P
    p = float(np.real(np.trace(M)))
    if p > eps:
        rho_new = (M / p)
        rho_new = (rho_new + rho_new.conj().T) / 2
        return rho_new, p
    return rho, 0.0

def commutator(A: np.ndarray, B: np.ndarray) -> np.ndarray:
    return A @ B - B @ A

def noncommutativity(A: np.ndarray, B: np.ndarray) -> float:
    return float(np.linalg.norm(commutator(A, B), ord='fro'))

# ---------- Stateful helper (ledger of Q&A) ----------

class SymbolicState:
    def __init__(self, dim: int | None = None, rho: np.ndarray | None = None):
        if rho is None:
            if dim is None:
                raise ValueError("Provide dim or rho")
            self.rho = np.eye(dim, dtype=np.complex128) / dim  # maximally mixed
            self.dim = dim
        else:
            self.rho = np.asarray(rho, dtype=np.complex128)
            self.dim = self.rho.shape[0]
        self.ledger: list[tuple[str, str | None, float]] = []

    def degree(self, P: np.ndarray, name: str | None = None) -> float:
        d = truth_degree(self.rho, P)
        if name:
            self.ledger.append(("degree", name, d))
        return d

    def ask(self, P: np.ndarray, name: str | None = None) -> float:
        rho_new, p = luders_update(self.rho, P)
        self.ledger.append(("ask", name, p))
        self.rho = rho_new
        return p

    def copy(self) -> "SymbolicState":
        s = SymbolicState(rho=self.rho.copy())
        s.ledger = list(self.ledger)
        return s

# ---------- Tiny demo: order/context effects ----------

if __name__ == "__main__":
    d = 3
    e0 = np.array([1, 0, 0], dtype=np.complex128)
    e1 = np.array([0, 1, 0], dtype=np.complex128)
    e2 = np.array([0, 0, 1], dtype=np.complex128)

    # Concepts as subspaces / rank-1 projectors onto unit vectors
    P_bird   = projector_from_basis(e0)                     # "bird"
    v_fly    = normalize(0.8*e0 + 0.6*e1)                   # "flying"
    P_flying = projector_from_basis(v_fly)
    P_penguin= projector_from_basis(e2)                     # "penguin"

    S = SymbolicState(dim=d)  # start maximally mixed: ignorance

    base_bird  = S.degree(P_bird,   "bird")
    base_fly   = S.degree(P_flying, "flying")
    print(f"Initial truth degrees: bird={base_bird:.3f}, flying={base_fly:.3f}")

    # Ask 'bird?' then 'flying?'
    S1 = SymbolicState(dim=d)
    p_bird = S1.ask(P_bird, "bird")
    deg_fly_after_bird = S1.degree(P_flying)
    print(f"[bird→flying]  P(yes bird)={p_bird:.3f},  flying after bird={deg_fly_after_bird:.3f}")

    # Ask 'flying?' then 'bird?'
    S2 = SymbolicState(dim=d)
    p_fly = S2.ask(P_flying, "flying")
    deg_bird_after_fly = S2.degree(P_bird)
    print(f"[flying→bird]  P(yes flying)={p_fly:.3f}, bird after flying={deg_bird_after_fly:.3f}")

    # Noncommutativity (if >0, order can matter)
    nc = noncommutativity(P_bird, P_flying)
    print(f"Noncommutativity ||[P_bird,P_flying]||_F = {nc:.3f}")
