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
"""Wave utilities."""
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

OUTPUT_DIR = Path(__file__).resolve().parent / "output" / "logic"


def save_sine_wave() -> Path:
    """Save a simple sine wave plot."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_DIR / "sine_wave.png"
    x = np.linspace(0, 2 * np.pi, 100)
    y = np.sin(x)
    plt.figure(figsize=(4, 3))
    plt.plot(x, y)
    plt.title("Sine Wave")
    plt.savefig(out_file)
    plt.close()
    return out_file
