"""Minimal quiet loop experiment for detecting a charged moment."""
from __future__ import annotations

import random
from typing import Iterator, Tuple


def quiet_loop(
    *,
    seed: int = 2025,
    steps: int = 64,
    drift: float = 0.18,
    damping: float = 0.88,
    threshold: float = 0.36,
) -> Iterator[Tuple[int, float]]:
    """Yield step/value pairs whenever the state breaks the surprise threshold."""
    random.seed(seed)
    state = 0.0
    for step in range(steps):
        state = damping * state + (random.random() * 2 - 1) * drift
        if abs(state) > threshold:
            yield step, state


if __name__ == "__main__":
    for step, value in quiet_loop():
        print(f"{step:02d} :: {value:+.3f}")
