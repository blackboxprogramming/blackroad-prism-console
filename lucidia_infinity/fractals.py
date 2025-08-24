"""Ψ′ fractal explorations.

A light‑weight Mandelbrot style fractal is implemented.  The function
:func:`generate_fractal` writes the resulting image into
``output/fractals`` and returns the file path.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def generate_fractal(
    width: int = 400, height: int = 400, max_iter: int = 50, output_dir: Path | str = Path("output/fractals")
) -> str:
    """Generate a simple Mandelbrot fractal and save it."""

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    x = np.linspace(-2.0, 1.0, width)
    y = np.linspace(-1.5, 1.5, height)
    C = x + y[:, None] * 1j
    Z = np.zeros_like(C)
    div_time = np.zeros(C.shape, dtype=int)
    for i in range(max_iter):
        Z = Z**2 + C
        diverge = np.abs(Z) > 2
        div_now = diverge & (div_time == 0)
        div_time[div_now] = i
        Z[diverge] = 2
    fig, ax = plt.subplots()
    ax.imshow(div_time, cmap="magma")
    ax.set_axis_off()
    path = out / "psi_fractal.png"
    fig.savefig(path, bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    return str(path)


def demo() -> str:
    """Generate an example fractal image."""

    return generate_fractal()
