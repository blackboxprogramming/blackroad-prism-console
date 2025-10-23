# lucidia_codex.py
# Minimal, dependency-light math engine for the Lucidia Codex.
# Only requires numpy. Optional: scipy (if available) improves numerics but not required.

import hashlib
import importlib.util
import math
import secrets
import time
from typing import Callable, Iterable, List, Sequence, Tuple

import numpy as np

EPS = 1e-9

# Optional SciPy support without mandatory dependency.
_scipy_stats_spec = importlib.util.find_spec("scipy.stats")
if _scipy_stats_spec is not None:  # pragma: no cover - optional path
    from scipy.stats import norm as _scipy_norm
else:  # pragma: no cover - default path when scipy absent
    _scipy_norm = None


# -----------------------------
# 0) Utilities
# -----------------------------

def _chol_psd(A: np.ndarray, jitter: float = 1e-10, max_tries: int = 7) -> np.ndarray:
    """Cholesky with tiny jitter to handle PSD matrices."""
    eye = np.eye(A.shape[0])
    for _ in range(max_tries):
        try:
            return np.linalg.cholesky(A + jitter * eye)
        except np.linalg.LinAlgError:
            jitter *= 10
    # Fall back to SVD-based sqrt if truly ill-conditioned
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return U @ np.diag(np.sqrt(np.maximum(s, 0))) @ Vt


def _project_symmetric(A: np.ndarray) -> np.ndarray:
    return 0.5 * (A + A.T)


def _softplus(x: np.ndarray) -> np.ndarray:
    return np.log1p(np.exp(-np.abs(x))) + np.maximum(x, 0)


# -----------------------------
# 1) Symplectic Optimizer (Hamiltonian Heart)
# -----------------------------
class SymplecticOptimizer:
    r"""
    Volume-preserving optimizer for long-horizon stability.

    Equations:
      Let parameters θ and auxiliary momenta p evolve under Hamiltonian
        H(θ, p) = F(θ) + (1/2) ||p||^2
      Leapfrog steps:
        p_{t+1/2} = p_t - (η/2) ∇_θ F(θ_t)
        θ_{t+1}   = θ_t + η p_{t+1/2}
        p_{t+1}   = p_{t+1/2} - (η/2) ∇_θ F(θ_{t+1})

    Invariant: phase-space volume preserved (Liouville).
    """

    def __init__(self, eta: float = 1e-2, seed: int | None = None) -> None:
        self.eta = float(eta)
        self.rng = np.random.default_rng(seed)
        self._p: np.ndarray | None = None

    def step(self, theta: np.ndarray, gradF: Callable[[np.ndarray], np.ndarray]) -> np.ndarray:
        if self._p is None:  # lazy init
            self._p = self.rng.normal(size=theta.shape) * 0.0
        p = self._p.copy()
        # half kick
        p -= 0.5 * self.eta * gradF(theta)
        # drift
        theta_new = theta + self.eta * p
        # half kick at new θ
        p -= 0.5 * self.eta * gradF(theta_new)
        self._p = p
        return theta_new


# -----------------------------
# 2) Control Barrier QP (safe by construction)
# -----------------------------
class ControlBarrierQP:
    r"""
    Solve min_u ||u - u0||^2 s.t.  ∇h(x)ᵀ(f(x)+g(x)u) ≥ -α(h(x))

    System:  ẋ = f(x) + g(x) u
    Safe set: S = { x : h(x) ≥ 0 }
    Barrier inequality:
        ∂h/∂x · (f + g u) ≥ -α(h(x))
    where α is class-K (e.g., α(s) = κ s)

    We solve a tiny QP via KKT closed form (single linear constraint).
    """

    def __init__(self, kappa: float = 2.0) -> None:
        self.kappa = float(kappa)

    def solve(
        self,
        x: np.ndarray,
        f: np.ndarray,
        g: np.ndarray,
        h: float,
        dh: np.ndarray,
        u0: np.ndarray,
    ) -> np.ndarray:
        """
        x: (n,)
        f: (n,)
        g: (n,m)
        h: scalar
        dh: (n,)
        u0: (m,)

        returns u* (m,)
        """
        # inequality: aᵀ u ≥ b
        a = dh @ g  # shape (m,)
        b = -self.kappa * h - dh @ f

        # If nominal u0 already satisfies, return u0
        if a @ u0 >= b - 1e-12:
            return u0

        # Solve min ||u-u0||^2 s.t. aᵀu ≥ b
        # Projection of u0 onto halfspace: u* = u0 + ((b - aᵀu0)/||a||^2) a
        denom = a @ a
        if denom < EPS:
            # Degenerate: no control authority along barrier; brake toward safe direction (no-op here)
            return u0
        u_star = u0 + ((b - a @ u0) / denom) * a
        return u_star


# -----------------------------
# 3) Differential Privacy Accountant (RDP for Gaussian mechanism)
# -----------------------------
class DPAccountantRDP:
    r"""
    Rényi DP (RDP) accountant for subsampled Gaussian mechanism.

    For Gaussian with noise σ and sampling rate q, order α>1:
      ε_α ≈ (1/(α-1)) * log( 1 + q^2 * α / (2σ^2 - α) )    [tight-ish small-q approx]
    Convert RDP to (ε, δ) by:
      ε(δ) = min_α ( ε_α + log(1/δ)/(α-1) )

    We accumulate ε_α additively across releases and convert at query-time.
    """

    def __init__(self, orders: Sequence[float] | None = None) -> None:
        default_orders = [1.25, 2, 3, 5, 8, 10, 16, 32, 64]
        self.orders = np.array(orders if orders is not None else default_orders, dtype=float)
        self.eps_alpha = np.zeros_like(self.orders)

    def add_gaussian(self, sigma: float, q: float = 1.0, times: int = 1) -> None:
        sigma = float(sigma)
        q = float(q)
        for _ in range(times):
            for i, alpha in enumerate(self.orders):
                if alpha <= 1.0:
                    continue
                # Avoid invalid region: require 2σ^2 > α
                if 2 * (sigma**2) <= alpha:
                    # fall back to large-σ conservative bound
                    inc = 1e6
                else:
                    inc = (1.0 / (alpha - 1.0)) * np.log(1.0 + (q * q) * alpha / (2.0 * (sigma**2) - alpha))
                self.eps_alpha[i] += inc

    def get_epsilon(self, delta: float) -> Tuple[float, float]:
        delta = float(delta)
        vals = self.eps_alpha + np.log(1.0 / delta) / (self.orders - 1.0)
        idx = int(np.argmin(vals))
        return float(vals[idx]), float(self.orders[idx])


# -----------------------------
# 4) Randomized Smoothing Certification (L2)
# -----------------------------
class RandomizedSmoothingCertifier:
    r"""
    Certified robustness via Gaussian smoothing.

    Given base classifier f and noise η ~ N(0, σ² I):
      g(x) = argmax_c P[f(x+η)=c]
    Certified radius:
      R = σ ( Φ^{-1}(pA) - Φ^{-1}(pB) ),
    where pA is lower bound of top class probability, pB upper bound of runner-up.
    """

    def __init__(self, sigma: float = 0.5, seed: int | None = None) -> None:
        self.sigma = float(sigma)
        self.rng = np.random.default_rng(seed)

    def certify(
        self,
        logits_fn: Callable[[np.ndarray], Sequence[float]],
        x: np.ndarray,
        num_samples: int = 20000,
        alpha: float = 0.001,
    ) -> dict[str, float | int]:
        # Monte Carlo estimate of class probabilities with Wilson bounds tuned by alpha
        y: List[int] = []
        for _ in range(num_samples):
            noise = self.rng.normal(scale=self.sigma, size=x.shape)
            cls = int(np.argmax(logits_fn(x + noise)))
            y.append(cls)
        y_arr = np.array(y)
        counts = np.bincount(y_arr, minlength=int(y_arr.max() + 1))
        A = int(np.argmax(counts))
        nA = int(counts[A])
        n = int(y_arr.size)

        alpha = float(alpha)
        if not (0.0 < alpha < 1.0):
            alpha = min(max(alpha, 1e-12), 1 - 1e-12)

        alpha_lower = max(min(alpha / 2.0, 1 - 1e-12), 1e-12)
        alpha_upper = alpha_lower

        counts_noA = counts.copy()
        counts_noA[A] = 0
        if counts_noA.size <= 1 or int(counts_noA.max()) == 0:
            B = -1
            nB = 0
        else:
            B = int(np.argmax(counts_noA))
            nB = int(counts[B])

        def phi_inv(p: float) -> float:
            p = min(max(p, 1e-12), 1 - 1e-12)
            if _scipy_norm is not None:
                return float(_scipy_norm.ppf(p))
            return math.sqrt(2.0) * math.erfinv(2 * p - 1)

        def wilson_lower(count: int, total: int, alpha_one_sided: float) -> float:
            if total == 0:
                return 0.0
            z = phi_inv(1.0 - alpha_one_sided)
            p_hat = count / total
            denom = 1.0 + (z * z) / total
            center = p_hat + (z * z) / (2.0 * total)
            margin = z * math.sqrt((p_hat * (1.0 - p_hat) + (z * z) / (4.0 * total)) / total)
            bound = (center - margin) / denom
            return float(min(max(bound, 0.0), 1.0))

        def wilson_upper(count: int, total: int, alpha_one_sided: float) -> float:
            if total == 0:
                return 1.0
            z = phi_inv(1.0 - alpha_one_sided)
            p_hat = count / total
            denom = 1.0 + (z * z) / total
            center = p_hat + (z * z) / (2.0 * total)
            margin = z * math.sqrt((p_hat * (1.0 - p_hat) + (z * z) / (4.0 * total)) / total)
            bound = (center + margin) / denom
            return float(min(max(bound, 0.0), 1.0))

        pA_emp = nA / n if n > 0 else 0.0
        pB_emp = nB / n if n > 0 else 0.0
        pA_lower = wilson_lower(nA, n, alpha_lower)
        pB_upper = wilson_upper(nB, n, alpha_upper) if B >= 0 else 0.0

        R = self.sigma * (phi_inv(pA_lower) - phi_inv(pB_upper))
        return {
            "pred": A,
            "radius_L2": float(max(0.0, R)),
            "pA_hat": float(pA_emp),
            "pB_hat": float(pB_emp),
            "pA_lower": float(pA_lower),
            "pB_upper": float(pB_upper),
            "alpha": float(alpha),
        }


# -----------------------------
# 5) Conformal Risk Control (selective prediction)
# -----------------------------
class ConformalSelector:
    r"""
    Maintain empirical error ≤ α by abstaining on high nonconformity scores.

    Threshold q_α is the (1-α)(1+1/n) quantile of calibration scores.
    Online: update with sliding window (optional) and gate actions.
    """

    def __init__(self, alpha: float = 0.1, window: int | None = None) -> None:
        self.alpha = float(alpha)
        self.window = window
        self.scores: List[float] = []

    def calibrate(self, scores: Iterable[float]) -> None:
        scores_list = list(scores)
        if self.window is None:
            self.scores = [float(s) for s in scores_list]
        else:
            self.scores = [float(s) for s in scores_list[-self.window :]]

    def threshold(self) -> float:
        if not self.scores:
            return float("inf")
        n = len(self.scores)
        k = int(math.ceil((1 - self.alpha) * (n + 1))) - 1
        k = min(max(k, 0), n - 1)
        return float(np.partition(self.scores, k)[k])

    def accept(self, s_new: float) -> Tuple[bool, float]:
        q = self.threshold()
        return (s_new <= q), q

    def update(self, s_new: float) -> None:
        self.scores.append(float(s_new))
        if self.window is not None and len(self.scores) > self.window:
            self.scores = self.scores[-self.window :]


# -----------------------------
# 6) Shamir Secret Sharing (prime field)
# -----------------------------
class Shamir:
    r"""
    Split secret v into n shares over prime field p; any k reconstruct.

    v, shares in Z_p. Sample k-1 random coeffs a_1..a_{k-1}; polynomial:
      f(x) = v + a_1 x + ... + a_{k-1} x^{k-1}  (mod p)
    Share i: (i, f(i)).
    Reconstruct via Lagrange interpolation at x=0.
    """

    def __init__(self, p: int = (1 << 127) - 1) -> None:  # Mersenne-ish prime (2^127-1) for demo
        self.p = int(p)

    def _rand(self) -> int:
        return secrets.randbits(126) % self.p

    def split(self, v: int, n: int, k: int) -> List[Tuple[int, int]]:
        v = int(v) % self.p
        coeffs = [v] + [self._rand() for _ in range(k - 1)]

        def f(x: int) -> int:
            acc = 0
            xp = 1
            for a in coeffs:
                acc = (acc + a * xp) % self.p
                xp = (xp * x) % self.p
            return acc

        return [(i, f(i)) for i in range(1, n + 1)]

    def _inv(self, a: int) -> int:
        return pow(a % self.p, self.p - 2, self.p)

    def reconstruct(self, shares: Sequence[Tuple[int, int]]) -> int:
        xs = [int(i) for (i, _) in shares]
        ys = [int(y) for (_, y) in shares]
        k = len(shares)
        v = 0
        for j in range(k):
            xj, yj = xs[j], ys[j]
            num = 1
            den = 1
            for m in range(k):
                if m == j:
                    continue
                num = (num * (-xs[m])) % self.p
                den = (den * (xj - xs[m])) % self.p
            lj = (num * self._inv(den)) % self.p
            v = (v + yj * lj) % self.p
        return v


# -----------------------------
# 7) Rate-Limit Calculus (token bucket)
# -----------------------------
class TokenBucket:
    r"""
    Admit if tokens ≥ cost; tokens refill at r per second up to burst b.
    Worst-case allowance over T: rT + b
    """

    def __init__(self, rate_per_s: float, burst: float) -> None:
        self.r = float(rate_per_s)
        self.b = float(burst)
        self.tokens = float(burst)
        self.t_last = time.time()

    def _refill(self) -> None:
        now = time.time()
        dt = max(0.0, now - self.t_last)
        self.tokens = min(self.b, self.tokens + self.r * dt)
        self.t_last = now

    def allow(self, cost: float = 1.0) -> bool:
        self._refill()
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False


# -----------------------------
# 8) Hamiltonian Heart audit (H vs H')
# -----------------------------

def hamiltonian_gap(
    H_stated: Callable[..., float],
    H_revealed: Callable[..., float],
    grid: Iterable[Sequence[float]],
) -> float:
    r"""
    Compute ||H - H'||₂ over a grid of states/actions.

    H: callable(state)->scalar or (state,action)->scalar
    grid: array of shape (N, d) or (N, d_action, d_state) depending on H'.
    """

    vals: List[float] = []
    for s in grid:
        try:
            v = float(H_stated(s))
        except TypeError:
            v = float(H_stated(*s))
        try:
            v2 = float(H_revealed(s))
        except TypeError:
            v2 = float(H_revealed(*s))
        vals.append((v - v2) ** 2)
    return math.sqrt(sum(vals) / max(1, len(vals)))


# -----------------------------
# 9) Hash-based provenance tag (lightweight)
# -----------------------------

def provenance_tag(*chunks: bytes | str) -> str:
    """
    Produce a stable tag from ordered binary/text chunks.
    """

    h = hashlib.sha3_256()
    for c in chunks:
        data = c.encode("utf-8") if isinstance(c, str) else c
        h.update(data)
        h.update(b"|")
    return h.hexdigest()


# -----------------------------
# 10) Tiny demo / self-test
# -----------------------------
if __name__ == "__main__":
    # ---- Symplectic optimizer demo on a convex bowl F(θ)=1/2 ||θ||^2
    def Fgrad(theta: np.ndarray) -> np.ndarray:
        return theta

    theta = np.array([5.0, -3.0])
    opt = SymplecticOptimizer(eta=0.1, seed=42)
    for _ in range(50):
        theta = opt.step(theta, Fgrad)
    print("[symplectic] theta≈", theta)

    # ---- Barrier QP demo: 1D system xdot = u, safe h(x)=x   (keep x≥0)
    cbf = ControlBarrierQP(kappa=3.0)
    x = np.array([-0.2])
    f = np.array([0.0])
    g = np.array([[1.0]])  # n=1, m=1
    h_val = float(x[0])
    dh = np.array([1.0])
    u0 = np.array([0.0])  # nominal wants to do nothing
    u = cbf.solve(x, f, g, h_val, dh, u0)
    print("[cbf] u*=", u, "check barrier:", dh @ (f + g @ u) + 3.0 * h_val)

    # ---- DP accountant demo
    acc = DPAccountantRDP()
    acc.add_gaussian(sigma=2.0, q=0.05, times=1000)
    eps, order = acc.get_epsilon(delta=1e-6)
    print(f"[dp] epsilon≈{eps:.3f} at order α={order}")

    # ---- Shamir demo
    shamir = Shamir()
    secret = 12345678901234567890
    shares = shamir.split(secret, n=5, k=3)
    rec = shamir.reconstruct(shares[:3])
    print("[shamir] ok:", rec == secret)

    # ---- Token bucket demo
    tb = TokenBucket(rate_per_s=5, burst=10)
    ok = [tb.allow(3) for _ in range(5)]
    print("[bucket] admits:", ok)

    # ---- Provenance tag
    tag = provenance_tag("zkVK#123", b"\x00\x01", "build:abcd")
    print("[prov] tag:", tag[:16], "…")
