"""Deterministic stub data for the fluid benchmark."""
from __future__ import annotations

import math
from pathlib import Path
from typing import Dict, Union

import numpy as np

FieldMap = Dict[str, np.ndarray]


def _grid(resolution: int = 24) -> np.ndarray:
    coords = np.linspace(0.0, 1.0, resolution)
    grid = np.stack(np.meshgrid(coords, coords, coords, indexing="ij"), axis=-1)
    return grid


def baseline_fields(resolution: int = 24) -> FieldMap:
    grid = _grid(resolution)
    x, y, z = grid[..., 0], grid[..., 1], grid[..., 2]

    # Swirling velocity profile that respects the tank boundaries.
    velocity = np.empty((*x.shape, 3), dtype=np.float32)
    velocity[..., 0] = -np.sin(math.pi * y) * np.cos(math.pi * z)
    velocity[..., 1] = np.sin(math.pi * x) * np.cos(math.pi * z)
    velocity[..., 2] = 0.25 * np.sin(math.pi * x) * np.sin(math.pi * y)

    # Mild stratification in density/pressure.
    pressure = 1000.0 + 5.0 * np.sin(math.pi * x) * np.sin(math.pi * y) * np.cos(math.pi * z)

    # Surface height expressed as a 2D map (top layer sample).
    surface_height = 1.0 - 0.1 * np.sin(math.pi * x[:, :, -1]) * np.sin(math.pi * y[:, :, -1])

    return {
        "velocity_t000400.npz": velocity,
        "pressure_t000400.npz": pressure.astype(np.float32),
        "surface_height_t000400.npy": surface_height.astype(np.float32),
    }


def benchmark_fields(resolution: int = 24, amplitude: float = 0.05) -> FieldMap:
    base = baseline_fields(resolution)
    rng = np.random.default_rng(42)
    noisy = {}
    for name, data in base.items():
        jitter = rng.normal(scale=amplitude, size=data.shape).astype(np.float32)
        noisy[name] = data + jitter
    return noisy


def save_fields(fields: FieldMap, directory: Union[str, Path]) -> None:
    path = Path(directory)
    path.mkdir(parents=True, exist_ok=True)
    for filename, array in fields.items():
        target = path / filename
        if target.suffix == ".npz":
            np.savez(target, field=array)
        else:
            np.save(target, array)
