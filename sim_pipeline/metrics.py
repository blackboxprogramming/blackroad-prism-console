"""Metrics helpers for the simulation orchestration pipeline."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable

import json
import numpy as np

from .paths import ensure_directory


@dataclass(frozen=True)
class MetricThreshold:
    """Represents an acceptable inclusive range for a metric."""

    lower: float
    upper: float

    def contains(self, value: float) -> bool:
        return self.lower <= value <= self.upper


def _load_npz(path: Path, key: str) -> np.ndarray:
    with np.load(path) as data:
        return data[key]


def compute_fluid_metrics(fluid_dir: Path) -> Dict[str, float]:
    """Load the PySPH (or stub) outputs and compute summary metrics."""

    velocity = _load_npz(fluid_dir / "velocity_t000400.npz", "velocity")
    pressure = _load_npz(fluid_dir / "pressure_t000400.npz", "pressure")
    surface = np.load(fluid_dir / "surface_height_t000400.npy")

    speed = np.linalg.norm(velocity, axis=-1)
    metrics = {
        "fluid_speed_mean": float(speed.mean()),
        "fluid_speed_max": float(speed.max()),
        "fluid_pressure_mean": float(pressure.mean()),
        "fluid_pressure_std": float(pressure.std()),
        "fluid_surface_peak": float(surface.max()),
    }
    return metrics


def compute_solid_metrics(solid_dir: Path) -> Dict[str, float]:
    """Load the Taichi-MPM (or stub) outputs and compute summary metrics."""

    stress = _load_npz(solid_dir / "von_mises_t000400.npz", "von_mises")
    metrics = {
        "solid_stress_mean": float(stress.mean()),
        "solid_stress_std": float(stress.std()),
        "solid_stress_peak": float(stress.max()),
    }
    return metrics


def aggregate_metrics(metric_groups: Iterable[Dict[str, float]]) -> Dict[str, float]:
    """Merge metric dictionaries into a single mapping."""

    merged: Dict[str, float] = {}
    for group in metric_groups:
        merged.update(group)
    return merged


DEFAULT_THRESHOLDS: Dict[str, MetricThreshold] = {
    "fluid_speed_mean": MetricThreshold(0.15, 1.0),
    "fluid_speed_max": MetricThreshold(0.4, 1.8),
    "fluid_pressure_mean": MetricThreshold(-0.2, 0.6),
    "fluid_pressure_std": MetricThreshold(0.05, 0.6),
    "fluid_surface_peak": MetricThreshold(0.05, 0.8),
    "solid_stress_mean": MetricThreshold(0.02, 0.4),
    "solid_stress_std": MetricThreshold(0.01, 0.4),
    "solid_stress_peak": MetricThreshold(0.05, 0.9),
}


def evaluate_thresholds(metrics: Dict[str, float],
                        thresholds: Dict[str, MetricThreshold] = DEFAULT_THRESHOLDS) -> Dict[str, bool]:
    """Return a mapping of metric name to pass/fail (True/False)."""

    return {name: thresholds[name].contains(metrics[name]) for name in thresholds}


def serialise_report(metrics: Dict[str, float], checks: Dict[str, bool]) -> str:
    """Return a formatted JSON report string."""

    payload = {
        "metrics": metrics,
        "checks": checks,
        "passed": all(checks.values()),
    }
    return json.dumps(payload, indent=2, sort_keys=True)


def write_report(path: Path, metrics: Dict[str, float], checks: Dict[str, bool]) -> None:
    """Persist the report to *path* as JSON."""

    ensure_directory(path.parent)
    path.write_text(serialise_report(metrics, checks))
