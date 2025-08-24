"""Fractal generation utilities."""
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

OUTPUT_DIR = Path(__file__).resolve().parent / "output" / "fractals"


def generate_mandelbrot(width: int = 200, height: int = 200, max_iter: int = 50) -> Path:
    """Generate a simple Mandelbrot set image."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_DIR / "mandelbrot.png"
    x = np.linspace(-2.0, 1.0, width)
    y = np.linspace(-1.5, 1.5, height)
    C = x[:, None] + 1j * y[None, :]
    Z = np.zeros_like(C)
    mask = np.zeros(C.shape, dtype=int)
    for i in range(max_iter):
        Z = Z ** 2 + C
        mask += (np.abs(Z) < 2)
    plt.figure(figsize=(4, 4))
    plt.imshow(mask.T, cmap="magma", origin="lower")
    plt.axis("off")
    plt.savefig(out_file, bbox_inches="tight", pad_inches=0)
    plt.close()
    return out_file
