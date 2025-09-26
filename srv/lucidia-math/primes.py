"""Prime and pattern exploration utilities.

Only small illustrative implementations are provided: generation of an Ulam
spiral, construction of modular residue grids and a Fourier transform of prime
number gaps.  The produced images are written to ``output/primes`` with a
timestamp so that runs are reproducible.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import List

import matplotlib.pyplot as plt
import numpy as np
import sympy as sp

__all__ = ["ulam_spiral", "residue_grid", "prime_gap_fft", "demo"]


def _timestamp() -> str:
    return datetime.utcnow().strftime("%Y%m%d-%H%M%S")


def ulam_spiral(size: int = 101) -> np.ndarray:
    """Return an ``size``\ x\ ``size`` array forming an Ulam prime spiral."""

    if size % 2 == 0:
        raise ValueError("size must be odd so there is a center cell")

    spiral = np.zeros((size, size), dtype=int)
    x = y = size // 2
    dx, dy = 0, -1
    for n in range(1, size * size + 1):
        if -size // 2 < x <= size // 2 and -size // 2 < y <= size // 2:
            if sp.isprime(n):
                spiral[y + size // 2, x + size // 2] = 1
        if x == y or (x < 0 and x == -y) or (x > 0 and x == 1 - y):
            dx, dy = -dy, dx
        x, y = x + dx, y + dy
    return spiral


def residue_grid(mod: int = 10) -> np.ndarray:
    """Return a grid of modular residues for values ``0..mod^2``."""

    numbers = np.arange(mod ** 2).reshape(mod, mod)
    return numbers % mod


def prime_gap_fft(limit: int = 200) -> np.ndarray:
    """Return the magnitude of the FFT of prime number gaps up to ``limit``."""

    primes: List[int] = list(sp.primerange(2, limit))
    gaps = np.diff(primes)
    fft_vals = np.fft.fft(gaps)
    return np.abs(fft_vals)


def _save_image(path: Path, data: np.ndarray, title: str) -> None:
    fig, ax = plt.subplots()
    ax.imshow(data, cmap="viridis", interpolation="nearest")
    ax.set_title(title)
    fig.savefig(path)
    plt.close(fig)


def demo(output_dir: Path | str = Path("output/primes")) -> dict:
    """Generate example artefacts for prime exploration and return metadata."""

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    ts = _timestamp()

    spiral = ulam_spiral(51)
    spiral_path = out / f"ulam_spiral_{ts}.png"
    _save_image(spiral_path, spiral, "Ulam Spiral")

    grid = residue_grid(10)
    grid_path = out / f"residue_grid_{ts}.png"
    _save_image(grid_path, grid, "Residue Grid")

    fft_vals = prime_gap_fft(200)
    fft_path = out / f"prime_gap_fft_{ts}.png"
    fig, ax = plt.subplots()
    ax.plot(fft_vals)
    ax.set_title("FFT of Prime Gaps")
    fig.savefig(fft_path)
    plt.close(fig)

    return {
        "ulam_spiral": str(spiral_path),
        "residue_grid": str(grid_path),
        "prime_gap_fft": str(fft_path),
    }
"""Prime number utilities and visualization."""
from pathlib import Path
import matplotlib.pyplot as plt
from sympy import primerange

OUTPUT_DIR = Path(__file__).resolve().parent / "output" / "primes"


def generate_plot(limit: int = 50) -> Path:
    """Plot primes up to ``limit`` and return the file path."""
    primes = list(primerange(2, limit))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_DIR / "prime_plot.png"
    plt.figure(figsize=(4, 3))
    plt.plot(primes, "bo")
    plt.title("Prime Numbers")
    plt.savefig(out_file)
    plt.close()
    return out_file
