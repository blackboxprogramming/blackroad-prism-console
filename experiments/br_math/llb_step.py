"""Language–Lindblad step prototype.

Implements a single Euler–Maruyama update of logits inspired by the
Language–Lindblad equation.  The function is intentionally tiny and
framework agnostic; callers supply gradients for prompt, memory, kindness
and harm potentials.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable
import numpy as np


@dataclass
class Potentials:
    """Container for gradient callables.

    Each callable accepts the current logits and returns a gradient with
    the same shape.
    """

    grad_prompt: Callable[[np.ndarray], np.ndarray]
    grad_memory: Callable[[np.ndarray], np.ndarray]
    grad_kindness: Callable[[np.ndarray], np.ndarray]
    grad_harm: Callable[[np.ndarray], np.ndarray]


def llb_step(
    logits: np.ndarray,
    potentials: Potentials,
    dt: float = 1e-2,
    noise_scale: float = 1e-3,
    lam_k: float = 1.0,
    lam_h: float = 1.0,
) -> np.ndarray:
    """Perform one stochastic update of the logits.

    Parameters
    ----------
    logits: current logit vector.
    potentials: gradients of prompt, memory, kindness and harm potentials.
    dt: integration step.
    noise_scale: standard deviation of gaussian noise.
    lam_k: kindness strength.
    lam_h: harm penalty.
    """

    lap = np.zeros_like(logits)  # placeholder for \nabla^2_E logit smoothing
    grad = (
        lap
        - potentials.grad_prompt(logits)
        - potentials.grad_memory(logits)
        + lam_k * potentials.grad_kindness(logits)
        - lam_h * potentials.grad_harm(logits)
    )
    noise = np.random.normal(scale=noise_scale, size=logits.shape)
    return logits + dt * grad + noise


__all__ = ["Potentials", "llb_step"]
