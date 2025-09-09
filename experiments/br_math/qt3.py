"""Quaternion‑Ternary token algebra utilities."""
from __future__ import annotations

from dataclasses import dataclass
import numpy as np

TERNARY = (-1, 0, 1)


def ternary_mul(a: int, b: int) -> int:
    """Balanced‑ternary multiplication with 0 absorbing."""
    if a == 0 or b == 0:
        return 0
    return 1 if a == b else -1


@dataclass
class QT3:
    """Quaternion‑Ternary statement."""

    v: int
    q: np.ndarray  # (4,) quaternion [w,x,y,z]

    def __post_init__(self) -> None:
        if self.v not in TERNARY:
            raise ValueError("v must be -1,0,+1")
        self.q = np.asarray(self.q, dtype=float)
        self.q = self.q / np.linalg.norm(self.q)

    def star(self, other: "QT3") -> "QT3":
        """Compose with another statement."""
        v = ternary_mul(self.v, other.v)
        q = quat_mul(self.q, other.q)
        return QT3(v=v, q=q)


def quat_mul(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Quaternion multiplication."""
    w1, x1, y1, z1 = a
    w2, x2, y2, z2 = b
    return np.array(
        [
            w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
            w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
            w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
            w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
        ]
    )


__all__ = ["QT3", "ternary_mul", "quat_mul"]
