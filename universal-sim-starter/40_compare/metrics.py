"""Reusable metrics for comparing Genesis outputs to reference simulations."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, Tuple

import numpy as np


ArrayLike = np.ndarray


def _ensure_array(points: Iterable[Iterable[float]]) -> ArrayLike:
    array = np.asarray(points, dtype=np.float64)
    if array.ndim != 2 or array.shape[1] != 3:
        raise ValueError("Point clouds must be shaped (N, 3).")
    return array


def hausdorff_distance(points_a: Iterable[Iterable[float]], points_b: Iterable[Iterable[float]]) -> float:
    """Compute the symmetric Hausdorff distance between two point clouds."""
    a = _ensure_array(points_a)
    b = _ensure_array(points_b)

    if a.size == 0 or b.size == 0:
        raise ValueError("Point clouds must be non-empty.")

    d_ab = np.sqrt(((a[:, None, :] - b[None, :, :]) ** 2).sum(axis=2))
    directed_ab = d_ab.min(axis=1).max()
    directed_ba = d_ab.min(axis=0).max()
    return float(max(directed_ab, directed_ba))


def stress_L2(sigma_gen: ArrayLike, sigma_ref: ArrayLike) -> float:
    """Return the L2 norm of the difference between generated and reference stress tensors."""
    sigma_gen = np.asarray(sigma_gen, dtype=np.float64)
    sigma_ref = np.asarray(sigma_ref, dtype=np.float64)
    if sigma_gen.shape != sigma_ref.shape:
        raise ValueError("Stress arrays must have identical shapes.")
    diff = sigma_gen - sigma_ref
    return float(np.linalg.norm(diff.ravel(), ord=2))


def contact_time_diff(t_gen: float, t_ref: float) -> float:
    """Absolute timing difference between generated and reference contact events."""
    return float(abs(t_gen - t_ref))


def splash_MSE(h_gen: ArrayLike, h_ref: ArrayLike) -> float:
    """Mean-squared error between generated and reference free-surface heights."""
    h_gen = np.asarray(h_gen, dtype=np.float64)
    h_ref = np.asarray(h_ref, dtype=np.float64)
    if h_gen.shape != h_ref.shape:
        raise ValueError("Height arrays must have identical shapes.")
    diff = h_gen - h_ref
    return float(np.mean(diff ** 2))


def mass_drift(mass_t: ArrayLike) -> Tuple[float, float]:
    """Return the max absolute drift and final drift relative to the initial mass."""
    mass = np.asarray(mass_t, dtype=np.float64)
    if mass.ndim != 1:
        raise ValueError("Mass trajectory must be a 1-D array.")
    baseline = mass[0]
    deviations = mass - baseline
    max_drift = float(np.max(np.abs(deviations)))
    final_drift = float(deviations[-1])
    return max_drift, final_drift


def load_npz(path: Path, key: str) -> ArrayLike:
    """Convenience loader for `.npz` files with a single metric target."""
    with np.load(path) as data:
        if key not in data:
            raise KeyError(f"Key '{key}' not found in {path}.")
        return data[key]
