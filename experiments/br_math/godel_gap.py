"""Gödel–Gap potential scorer."""
from __future__ import annotations

from typing import Iterable
import numpy as np


def godel_gap(complexities: Iterable[float], evidences: Iterable[float], alpha: float = 1.0, beta: float = 1.0) -> float:
    """Compute \Phi_G = alpha * K - beta * I."""
    k = np.sum(list(complexities))
    i = np.sum(list(evidences))
    return alpha * k - beta * i


__all__ = ["godel_gap"]
