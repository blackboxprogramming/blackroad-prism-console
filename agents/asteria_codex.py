"""Numerical safety helpers for the Asteria Codex toolkit.

This module collects utilities that make traditionally undefined or unstable
numerical operations usable inside Prism experiments.  Each helper mirrors a
common "undefined" scenario—division by zero, singular linear systems,
nonsmooth gradients, discontinuous dynamics, principal value integrals and
uncertain inputs—and exposes a deterministic policy for handling it.

Functions
---------
safe_div
    Division with configurable behaviour when the denominator is near zero.
solve_least_squares
    Stable least-squares solver with optional Tikhonov regularisation.
clarke_subgrad
    Sample-based Clarke subgradient estimator for nonsmooth functions.
step_filippov
    Simple Euler stepper for differential inclusions using Filippov averages.
pv_integral
    Principal value integral evaluator for simple poles.
propagate_cov
    Linear error propagation using a numerically estimated Jacobian.

Classes
-------
Interval
    Minimal interval-arithmetic type that keeps track of rounding/error bounds.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, Iterable

import numpy as np
from numpy.typing import ArrayLike, NDArray

__all__ = [
    "Interval",
    "clarke_subgrad",
    "propagate_cov",
    "pv_integral",
    "safe_div",
    "solve_least_squares",
    "step_filippov",
]


def _to_numpy(value: ArrayLike) -> NDArray[np.float64]:
    """Return ``value`` as a ``float64`` NumPy array."""

    return np.asarray(value, dtype=float)


def _broadcast_pair(a: ArrayLike, b: ArrayLike) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    """Broadcast two inputs to a shared ``float64`` array shape."""

    a_arr = _to_numpy(a)
    b_arr = _to_numpy(b)
    shape = np.broadcast_shapes(a_arr.shape, b_arr.shape)
    return np.broadcast_to(a_arr, shape), np.broadcast_to(b_arr, shape)


def safe_div(a: ArrayLike, b: ArrayLike, mode: str = "clamp", eps: float = 1e-12) -> ArrayLike:
    """Divide ``a`` by ``b`` with explicit handling of small denominators.

    Parameters
    ----------
    a, b:
        Numerators and denominators. Scalars and NumPy arrays are both
        accepted and are broadcast against each other.
    mode:
        Policy for handling ``|b| < eps``.
        ``"clamp"`` multiplies by the denominator and divides by
        ``b**2 + eps**2`` to smoothly limit the output.
        ``"zero"`` returns ``0`` wherever ``|b| < eps``.
        ``"nan"`` propagates ``np.nan`` for the same region.
    eps:
        Threshold for treating a denominator as numerically zero.

    Returns
    -------
    numpy.ndarray or float
        Broadcast result of the division using the requested policy. Scalar
        outputs are returned as Python ``float`` objects for convenience.
    """

    if eps <= 0:
        raise ValueError("eps must be positive")

    policy = mode.lower()
    if policy not in {"clamp", "zero", "nan"}:
        raise ValueError(f"unknown mode: {mode}")

    a_arr, b_arr = _broadcast_pair(a, b)

    if policy == "clamp":
        result = (a_arr * b_arr) / (b_arr * b_arr + eps * eps)
    else:
        mask = np.abs(b_arr) >= eps
        result = np.full_like(a_arr, 0.0 if policy == "zero" else np.nan)
        np.divide(a_arr, b_arr, out=result, where=mask)

    if result.shape == ():
        return float(result)  # Convert 0-D arrays to scalars.
    return result


def solve_least_squares(
    A: ArrayLike, b: ArrayLike, ridge: float = 0.0, rcond: float = 1e-12
) -> NDArray[np.float64]:
    """Solve ``Ax ≈ b`` with pseudoinverse or Tikhonov regularisation.

    When ``ridge`` is zero the Moore–Penrose pseudoinverse is used. Otherwise
    the function solves ``(AᵀA + ridge·I) x = Aᵀ b`` which corresponds to a
    Tikhonov-regularised least-squares solution.
    """

    A_arr = _to_numpy(A)
    b_arr = _to_numpy(b)

    if ridge < 0:
        raise ValueError("ridge must be non-negative")

    if ridge > 0:
        ata = A_arr.T @ A_arr
        ata += ridge * np.eye(A_arr.shape[1], dtype=float)
        atb = A_arr.T @ b_arr
        return np.linalg.solve(ata, atb)
    return np.linalg.pinv(A_arr, rcond=rcond) @ b_arr


def clarke_subgrad(
    f: Callable[[NDArray[np.float64]], float],
    x: ArrayLike,
    *,
    radius: float = 1e-4,
    samples: int = 64,
    seed: int | None = 0,
) -> Dict[str, NDArray[np.float64]]:
    """Estimate a Clarke subgradient cloud around ``x`` for function ``f``.

    The routine samples random directions on the unit sphere, evaluates a
    central difference along each direction, and projects the directional
    derivative back into ``ℝⁿ``. The return value provides the raw samples as
    well as their empirical mean and covariance.
    """

    if radius <= 0:
        raise ValueError("radius must be positive")
    if samples <= 0:
        raise ValueError("samples must be positive")

    rng = np.random.default_rng(seed)
    x_arr = _to_numpy(x)
    gradients: list[NDArray[np.float64]] = []

    for _ in range(samples):
        direction = rng.normal(size=x_arr.shape)
        norm = np.linalg.norm(direction)
        if norm == 0:
            continue
        direction /= norm
        xp = x_arr + radius * direction
        xm = x_arr - radius * direction
        forward = f(xp)
        backward = f(xm)
        directional = float(forward - backward) / (2.0 * radius)
        gradients.append(directional * direction)

    if not gradients:
        raise RuntimeError("Failed to sample any gradients; increase `samples`.")

    sample_matrix = np.vstack(gradients)
    mean = sample_matrix.mean(axis=0)
    cov = (
        np.cov(sample_matrix.T)
        if len(gradients) > 1
        else np.zeros((x_arr.size, x_arr.size))
    )
    return {"mean": mean, "cov": cov, "samples": sample_matrix}


def step_filippov(
    x: ArrayLike,
    F_set: Callable[[NDArray[np.float64]], Iterable[ArrayLike]],
    dt: float,
    project: Callable[[NDArray[np.float64]], ArrayLike] | None = None,
) -> NDArray[np.float64]:
    """Advance ``x`` by ``dt`` using the Filippov average of candidate velocities."""

    if dt <= 0:
        raise ValueError("dt must be positive")

    x_arr = _to_numpy(x)
    velocities = [
        _to_numpy(v)
        for v in F_set(x_arr)
    ]
    if not velocities:
        raise ValueError("F_set(x) must return at least one velocity.")

    vs = np.vstack(velocities)
    v_mean = vs.mean(axis=0)
    x_next = x_arr + dt * v_mean

    if project is not None:
        x_next = _to_numpy(project(x_next))

    return x_next


def pv_integral(
    f: Callable[[NDArray[np.float64]], NDArray[np.float64] | float],
    a: float,
    b: float,
    c: float,
    *,
    eps: float = 1e-6,
    n: int = 2048,
) -> float:
    """Approximate a Cauchy principal-value integral with a simple trapezoid rule."""

    if not (a < c < b):
        raise ValueError("c must lie strictly inside [a, b]")
    if eps <= 0:
        raise ValueError("eps must be positive")
    if n <= 0:
        raise ValueError("n must be positive")
    if c - eps <= a or c + eps >= b:
        raise ValueError("eps too large; integration regions overlap the pole")

    half = max(1, n // 2)

    def trap(lo: float, hi: float, segments: int) -> float:
        if segments <= 0:
            return 0.0
        xs = np.linspace(lo, hi, segments + 1)
        ys = np.asarray(f(xs), dtype=float) / (xs - c)
        return (hi - lo) * (ys[0] + 2.0 * ys[1:-1].sum() + ys[-1]) / (2.0 * segments)

    left = trap(a, c - eps, half)
    right = trap(c + eps, b, half)
    return float(left + right)


@dataclass(frozen=True)
class Interval:
    """Closed interval with basic arithmetic and zero-crossing checks."""

    lo: float
    hi: float

    def __post_init__(self) -> None:
        object.__setattr__(self, "lo", float(min(self.lo, self.hi)))
        object.__setattr__(self, "hi", float(max(self.lo, self.hi)))

    def __repr__(self) -> str:
        return f"[{self.lo}, {self.hi}]"

    def _coerce(self, other: ArrayLike) -> "Interval":
        return other if isinstance(other, Interval) else Interval(float(other), float(other))

    def __add__(self, other: ArrayLike) -> "Interval":
        rhs = self._coerce(other)
        return Interval(self.lo + rhs.lo, self.hi + rhs.hi)

    def __sub__(self, other: ArrayLike) -> "Interval":
        rhs = self._coerce(other)
        return Interval(self.lo - rhs.hi, self.hi - rhs.lo)

    def __mul__(self, other: ArrayLike) -> "Interval":
        rhs = self._coerce(other)
        candidates = [
            self.lo * rhs.lo,
            self.lo * rhs.hi,
            self.hi * rhs.lo,
            self.hi * rhs.hi,
        ]
        return Interval(min(candidates), max(candidates))

    def inv(self, eps: float = 0.0) -> "Interval":
        if self.lo - eps <= 0.0 <= self.hi + eps:
            raise ZeroDivisionError("interval contains 0; split domain")
        return Interval(1.0 / self.hi, 1.0 / self.lo)

    def __truediv__(self, other: ArrayLike) -> "Interval":
        rhs = self._coerce(other)
        return self * rhs.inv()


def propagate_cov(
    g: Callable[[NDArray[np.float64]], ArrayLike],
    x: ArrayLike,
    Sigma: ArrayLike,
    *,
    eps: float = 1e-4,
) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
    """Propagate covariance through ``g`` using a finite-difference Jacobian."""

    if eps <= 0:
        raise ValueError("eps must be positive")

    x_arr = _to_numpy(x)
    Sigma_arr = _to_numpy(Sigma)
    y0 = np.atleast_1d(_to_numpy(g(x_arr)))
    J = np.zeros((y0.size, x_arr.size), dtype=float)

    for i in range(x_arr.size):
        perturb = np.zeros_like(x_arr)
        perturb[i] = eps
        forward = np.atleast_1d(_to_numpy(g(x_arr + perturb)))
        backward = np.atleast_1d(_to_numpy(g(x_arr - perturb)))
        J[:, i] = (forward - backward) / (2.0 * eps)

    Sigma_y = J @ Sigma_arr @ J.T
    return Sigma_y, J
