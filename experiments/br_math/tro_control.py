"""Trust–Resilience ODE controller."""
from __future__ import annotations

import numpy as np


def tro_step(t: float, state: np.ndarray, params: np.ndarray) -> np.ndarray:
    """One step of the trust–resilience dynamics.

    Parameters
    ----------
    t: time (unused but included for ODE solver compatibility)
    state: array ``[T, R, S, E, Jc, K]`` representing trust, resilience,
        entropy, error, care current and kindness.
    params: array ``[alpha, beta, gamma, eta, mu, nu, xi]`` of coefficients.
    """

    T, R, S, E, Jc, K = state
    alpha, beta, gamma, eta, mu, nu, xi = params
    dT = alpha * K + gamma * Jc - beta * E - eta * S
    dR = mu * Jc - nu * E - xi * np.gradient([S, S])[0]  # crude \dot S estimate
    return np.array([dT, dR])


__all__ = ["tro_step"]
