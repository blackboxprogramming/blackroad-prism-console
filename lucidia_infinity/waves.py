"""Sine Wave Codex Algebra.

Sine waves are treated as algebraic objects supporting addition (superposition),
multiplication (modulation) and inversion (phase shift by π).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


@dataclass
class SineWave:
    """Simple representation of a sine wave."""

    frequency: float
    amplitude: float = 1.0
    phase: float = 0.0

    def sample(self, t: np.ndarray) -> np.ndarray:
        return self.amplitude * np.sin(2 * np.pi * self.frequency * t + self.phase)

    def __add__(self, other: "SineWave") -> "SineWave":
        return SineWave(
            frequency=self.frequency,
            amplitude=self.amplitude + other.amplitude,
            phase=self.phase,
        )

    def __mul__(self, other: "SineWave") -> "SineWave":
        return SineWave(
            frequency=self.frequency + other.frequency,
            amplitude=self.amplitude * other.amplitude,
            phase=self.phase + other.phase,
        )

    def inverse(self) -> "SineWave":
        return SineWave(self.frequency, self.amplitude, self.phase + np.pi)


def visualize_interference(
    a: SineWave, b: SineWave, path: Path | str = Path("output/waves/interference.png")
) -> str:
    """Visualise superposition of ``a`` and ``b`` and save to ``path``."""

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    t = np.linspace(0, 1, 1000)
    combined = (a + b).sample(t)
    fig, ax = plt.subplots()
    ax.plot(t, combined)
    ax.set_title("Wave Interference")
    fig.savefig(path)
    plt.close(fig)
    return str(path)


def demo() -> str:
    """Create an interference plot for two example waves."""

    a = SineWave(5, 1.0, 0)
    b = SineWave(7, 0.5, np.pi / 4)
    return visualize_interference(a, b)
