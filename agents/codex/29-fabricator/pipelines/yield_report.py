"""Rolling yield reporting utilities."""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Deque, Iterable, List


@dataclass
class YieldWindow:
    """Maintain a rolling yield value for the latest units."""

    size: int
    _buffer: Deque[bool]

    def __init__(self, size: int = 25) -> None:
        if size <= 0:
            raise ValueError("Window size must be positive.")
        self.size = size
        self._buffer = deque(maxlen=size)

    def update(self, passed: bool) -> float:
        self._buffer.append(passed)
        return self.current

    @property
    def current(self) -> float:
        if not self._buffer:
            return 1.0
        return sum(1 for state in self._buffer if state) / len(self._buffer)


def trendline(samples: Iterable[float]) -> List[float]:
    history: List[float] = []
    for value in samples:
        history.append(value if not history else history[-1] * 0.6 + value * 0.4)
    return history


__all__ = ["YieldWindow", "trendline"]
