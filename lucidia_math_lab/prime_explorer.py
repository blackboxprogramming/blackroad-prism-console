"""Prime pattern exploration and visualization utilities."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Tuple

import matplotlib.pyplot as plt
import numpy as np
import sympy as sp


@dataclass
class PrimeVisualizer:
    output_dir: Path

    def save_fig(self, fig: plt.Figure, name: str) -> None:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        png = self.output_dir / f"{name}.png"
        svg = self.output_dir / f"{name}.svg"
        fig.savefig(png)
        fig.savefig(svg)
        plt.close(fig)


def ulam_spiral(size: int) -> Tuple[np.ndarray, np.ndarray]:
    """Generate an Ulam spiral and mask of prime numbers."""

    grid = np.zeros((size, size), dtype=int)
    x = y = size // 2
    dx, dy = 0, -1
    for n in range(1, size * size + 1):
        if -size // 2 <= x < size // 2 and -size // 2 <= y < size // 2:
            grid[y + size // 2, x + size // 2] = n
        if x == y or (x < 0 and x == -y) or (x > 0 and x == 1 - y):
            dx, dy = -dy, dx
        x, y = x + dx, y + dy
    prime_mask = np.vectorize(sp.isprime)(grid)
    return grid, prime_mask


def plot_ulam(grid: np.ndarray, mask: np.ndarray) -> plt.Figure:
    fig, ax = plt.subplots()
    ax.imshow(mask, cmap="Greys")
    ax.set_xticks([])
    ax.set_yticks([])
    return fig


def residue_grid(mod: int, size: int = 100) -> np.ndarray:
    """Compute a modular residue grid.

    Parameters
    ----------
    mod:
        The modulus used for the residue computation.
    size:
        Total number of integers to include. ``size`` must be a perfect
        square so that the numbers can be reshaped into a square grid.

    Raises
    ------
    ValueError
        If ``size`` is not a perfect square.
    """

    numbers = np.arange(1, size + 1)
    side = int(np.sqrt(size))
    if side * side != size:
        raise ValueError("size must be a perfect square")
    return numbers.reshape(side, side) % mod


def plot_residue(grid: np.ndarray) -> plt.Figure:
    fig, ax = plt.subplots()
    ax.imshow(grid, cmap="viridis")
    ax.set_xticks([])
    ax.set_yticks([])
    return fig


def fourier_prime_gaps(limit: int) -> Tuple[np.ndarray, np.ndarray]:
    """Return prime gaps and their Fourier transform magnitude."""

    primes = list(sp.primerange(2, limit))
    gaps = np.diff(primes)
    fft = np.abs(np.fft.fft(gaps))
    return gaps, fft


def plot_fourier(gaps: np.ndarray, fft: np.ndarray) -> plt.Figure:
    fig, ax = plt.subplots(2, 1, figsize=(6, 6))
    ax[0].plot(gaps)
    ax[0].set_title("Prime gaps")
    ax[1].plot(fft)
    ax[1].set_title("FFT magnitude")
    return fig
