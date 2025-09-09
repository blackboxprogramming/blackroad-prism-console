"""Balanced‑ternary projection operator."""
from __future__ import annotations

import numpy as np


def abacus_projection(x: np.ndarray) -> np.ndarray:
    """Project a vector to the nearest balanced‑ternary lattice.

    Each element is rounded to -1, 0 or +1.
    """
    return np.clip(np.round(x), -1, 1)


def trlog(x: float) -> int:
    """Balanced‑ternary logarithm index for positive scalars."""
    if x <= 0:
        raise ValueError("x must be positive")
    return int(np.round(np.log(x) / np.log(3)))


__all__ = ["abacus_projection", "trlog"]
