"""Metric utilities shared by the CLI and notebook."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Tuple

import numpy as np

from .paths import SimulationPaths, PATHS

FluidFiles = (
    "velocity_t000400.npz",
    "pressure_t000400.npz",
    "surface_height_t000400.npy",
)

SolidFiles = (
    "displacement_t000400.npz",
    "von_mises_t000400.npy",
)


@dataclass
class FieldStats:
    name: str
    mae: float
    rmse: float
    max_abs: float
    mean_delta: float
    baseline_mean: float
    bench_mean: float
    shape: Tuple[int, ...]

    def to_dict(self) -> Dict[str, float]:
        return {
            "mae": self.mae,
            "rmse": self.rmse,
            "max_abs": self.max_abs,
            "mean_delta": self.mean_delta,
            "baseline_mean": self.baseline_mean,
            "bench_mean": self.bench_mean,
            "shape": self.shape,
        }


def _load_field(path: Path) -> np.ndarray:
    if not path.exists():
        raise FileNotFoundError(path)
    if path.suffix == ".npz":
        with np.load(path) as data:
            return data[data.files[0]]
    return np.load(path)


def _compute_stats(name: str, baseline: np.ndarray, bench: np.ndarray) -> FieldStats:
    diff = bench - baseline
    mae = float(np.mean(np.abs(diff)))
    rmse = float(np.sqrt(np.mean(diff ** 2)))
    max_abs = float(np.max(np.abs(diff)))
    mean_delta = float(np.mean(bench) - np.mean(baseline))
    return FieldStats(
        name=name,
        mae=mae,
        rmse=rmse,
        max_abs=max_abs,
        mean_delta=mean_delta,
        baseline_mean=float(np.mean(baseline)),
        bench_mean=float(np.mean(bench)),
        shape=tuple(int(v) for v in bench.shape),
    )


def _collect_stats(files: Iterable[str], base_dir: Path, bench_dir: Path) -> Dict[str, Dict[str, float]]:
    metrics: Dict[str, Dict[str, float]] = {}
    for filename in files:
        baseline_path = base_dir / filename
        bench_path = bench_dir / filename
        if not baseline_path.exists() or not bench_path.exists():
            continue
        baseline = _load_field(baseline_path)
        bench = _load_field(bench_path)
        stats = _compute_stats(filename, baseline, bench)
        metrics[filename] = stats.to_dict()
    return metrics


def compute(paths: SimulationPaths = PATHS) -> Dict[str, Dict[str, Dict[str, float]]]:
    result: Dict[str, Dict[str, Dict[str, float]]] = {}
    fluid_stats = _collect_stats(FluidFiles, paths.baseline_fluid, paths.bench_fluid)
    if fluid_stats:
        result["fluid"] = fluid_stats
    solid_stats = _collect_stats(SolidFiles, paths.baseline_solid, paths.bench_solid)
    if solid_stats:
        result["solid"] = solid_stats
    return result


def write(metrics: Dict, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(metrics, indent=2), encoding="utf-8")


def read(path: Path = PATHS.metrics_path) -> Dict:
    if not path.exists():
        raise FileNotFoundError(f"Metrics file missing: {path}")
    return json.loads(path.read_text(encoding="utf-8"))
