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
