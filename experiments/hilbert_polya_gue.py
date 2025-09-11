"""Hilbert–Pólya / GUE spacing test.

This script compares normalized spacing distributions of the
first `nzeros` nontrivial zeros of the Riemann zeta function and
random Gaussian Unitary Ensemble (GUE) eigenvalues against the
Wigner surmise.  It reports the Kolmogorov–Smirnov distance for
both samples relative to the Wigner CDF.
"""

from __future__ import annotations

import argparse
import math
from typing import Callable

import mpmath as mp
import numpy as np


def wigner_cdf(s: np.ndarray) -> np.ndarray:
    """CDF of the Wigner surmise for the GUE."""
    return np.vectorize(
        lambda x: math.erf(2 * x / math.sqrt(math.pi))
        - (4 * x / math.pi) * math.exp(-4 * x**2 / math.pi)
    )(s)


def ks_distance(sample: np.ndarray, cdf: Callable[[np.ndarray], np.ndarray]) -> float:
    """Return the two-sided Kolmogorov–Smirnov distance between a sample and a CDF."""
    x = np.sort(sample)
    n = x.size
    if n == 0:
        raise ValueError("sample must contain at least one element")
    cdf_vals = cdf(x)
    ecdf_right = np.arange(1, n + 1) / n
    ecdf_left = np.arange(0, n) / n
    d_plus = np.max(ecdf_right - cdf_vals)
    d_minus = np.max(cdf_vals - ecdf_left)
    return float(max(d_plus, d_minus))


def riemann_zeros(n: int) -> np.ndarray:
    """Return the imaginary parts of the first n Riemann zeta zeros."""
    mp.mp.dps = 30
    return np.array([float(mp.zetazero(k).imag) for k in range(1, n + 1)])


def normalized_spacings(vals: np.ndarray) -> np.ndarray:
    """Return consecutive spacings normalised to unit mean."""
    diffs = np.diff(vals)
    return diffs / np.mean(diffs)


def gue_spacings(n: int, k: int) -> np.ndarray:
    """Sample spacings from k random n×n GUE matrices."""
    spacings: list[float] = []
    for _ in range(k):
        a = np.random.normal(size=(n, n)) + 1j * np.random.normal(size=(n, n))
        h = (a + a.conj().T) / 2  # Hermitian
        eigvals = np.linalg.eigvalsh(h)
        spacings.extend(normalized_spacings(eigvals))
    return np.array(spacings)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--nzeros", type=int, default=200, help="number of zeta zeros")
    parser.add_argument("--gue_n", type=int, default=200, help="dimension of GUE matrix")
    parser.add_argument("--gue_k", type=int, default=20, help="number of GUE samples")
    args = parser.parse_args()

    zero_spacings = normalized_spacings(riemann_zeros(args.nzeros))
    gue_sample = gue_spacings(args.gue_n, args.gue_k)

    ks_zero = ks_distance(zero_spacings, wigner_cdf)
    ks_gue = ks_distance(gue_sample, wigner_cdf)

    print(f"KS distance (zeros vs Wigner): {ks_zero:.4f}")
    print(f"KS distance (GUE vs Wigner): {ks_gue:.4f}")


if __name__ == "__main__":
    main()
