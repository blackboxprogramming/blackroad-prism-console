"""Synthetic deformation fields for the soft-body benchmark."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Union

import numpy as np

FieldMap = Dict[str, np.ndarray]


def _lattice(resolution: int = 20) -> np.ndarray:
    coords = np.linspace(-0.5, 0.5, resolution)
    return np.stack(np.meshgrid(coords, coords, coords, indexing="ij"), axis=-1)


def baseline_fields(resolution: int = 20) -> FieldMap:
    lattice = _lattice(resolution)
    displacement = np.zeros_like(lattice, dtype=np.float32)
    von_mises = np.linalg.norm(lattice, axis=-1, ord=2).astype(np.float32)
    return {
        "displacement_t000400.npz": displacement,
        "von_mises_t000400.npy": von_mises,
    }


def benchmark_fields(resolution: int = 20, amplitude: float = 0.02) -> FieldMap:
    lattice = _lattice(resolution)
    disp = np.empty_like(lattice, dtype=np.float32)
    disp[..., 0] = 0.1 * lattice[..., 0]
    disp[..., 1] = -0.1 * lattice[..., 1]
    disp[..., 2] = 0.05 * np.sin(np.pi * lattice[..., 0]) * np.cos(np.pi * lattice[..., 1])
    von_mises = np.linalg.norm(disp, axis=-1, ord=2)
    rng = np.random.default_rng(7)
    disp += rng.normal(scale=amplitude, size=disp.shape).astype(np.float32)
    von_mises = von_mises.astype(np.float32)
    return {
        "displacement_t000400.npz": disp,
        "von_mises_t000400.npy": von_mises,
    }


def save_fields(fields: FieldMap, directory: Union[str, Path]) -> None:
    path = Path(directory)
    path.mkdir(parents=True, exist_ok=True)
    for filename, array in fields.items():
        target = path / filename
        if target.suffix == ".npz":
            np.savez(target, field=array)
        else:
            np.save(target, array)
