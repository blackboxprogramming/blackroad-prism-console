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
