"""Simplified material point method driver for the solid benchmark.

This script is intentionally lightweight – it mimics the data products of the
full Taichi implementation so downstream tooling can be exercised in a
CPU-only environment. The core loop integrates particle motion under gravity,
applies a damped floor contact, estimates Cauchy stress using a linear elastic
model, and finally exports a voxel-averaged von Mises stress field.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Tuple

import numpy as np


@dataclass(frozen=True)
class SimulationParams:
    grid_n: int
    duration_s: float
    dt: float
    rho: float
    e_a: float
    e_b: float
    nu: float
    contact_damping: float

    @classmethod
    def from_json(cls, path: Path) -> "SimulationParams":
        data = json.loads(path.read_text())
        return cls(
            grid_n=int(data["grid_n"]),
            duration_s=float(data["duration_s"]),
            dt=float(data["dt"]),
            rho=float(data["rho"]),
            e_a=float(data["E_A"]),
            e_b=float(data["E_B"]),
            nu=float(data["nu"]),
            contact_damping=float(data.get("contact_damping", 0.0)),
        )


def initialize_lattice(params: SimulationParams) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Generate a structured particle lattice and zero velocity field."""
    n = params.grid_n
    lin = (np.arange(n, dtype=np.float64) + 0.5) / n
    grid_x, grid_y, grid_z = np.meshgrid(lin, lin, lin, indexing="ij")
    positions = np.stack((grid_x, grid_y, grid_z), axis=-1)
    velocities = np.zeros_like(positions)
    return positions.reshape(-1, 3), positions.copy().reshape(-1, 3), velocities.reshape(-1, 3)


def apply_floor_contact(positions: np.ndarray, velocities: np.ndarray, damping: float) -> None:
    """Clamp particles against the z=0 plane with exponential damping."""
    mask = positions[:, 2] < 0.0
    if not np.any(mask):
        return
    damping_factor = math.exp(-max(damping, 0.0))
    positions[mask, 2] = 0.0
    velocities[mask, 2] = -velocities[mask, 2] * damping_factor
    velocities[mask, :2] *= damping_factor


def clamp_velocity(velocities: np.ndarray, max_speed: float) -> None:
    """Apply a global velocity clamp to maintain a CFL-like condition."""
    if max_speed <= 0:
        return
    speed = np.linalg.norm(velocities, axis=1)
    mask = speed > max_speed
    if not np.any(mask):
        return
    velocities[mask] *= (max_speed / speed[mask])[:, None]


def run_simulation(params: SimulationParams) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    positions, initial_positions, velocities = initialize_lattice(params)
    dt = params.dt
    steps = int(round(params.duration_s / dt))
    dx = 1.0 / params.grid_n
    max_speed = 0.25 * dx / max(dt, 1e-6)
    gravity = np.array([0.0, 0.0, -9.81], dtype=np.float64)

    for _ in range(steps):
        velocities += gravity * dt
        clamp_velocity(velocities, max_speed)
        positions += velocities * dt
        apply_floor_contact(positions, velocities, params.contact_damping)
        clamp_velocity(velocities, max_speed)
        positions = np.clip(positions, 0.0, 1.0)

    return positions, initial_positions, velocities


def compute_elastic_modulus(initial_positions: np.ndarray, params: SimulationParams) -> np.ndarray:
    n = params.grid_n
    grid = initial_positions.reshape(n, n, n, 3)
    z_threshold = 0.5
    return np.where(grid[..., 2] < z_threshold, params.e_a, params.e_b)


def compute_von_mises(
    positions: np.ndarray,
    initial_positions: np.ndarray,
    params: SimulationParams,
) -> Tuple[np.ndarray, np.ndarray]:
    n = params.grid_n
    dx = 1.0 / n

    current = positions.reshape(n, n, n, 3)
    reference = initial_positions.reshape(n, n, n, 3)
    displacement = current - reference

    grad_u = np.zeros((n, n, n, 3, 3), dtype=np.float64)
    for comp in range(3):
        grads = np.gradient(displacement[..., comp], dx, edge_order=2)
        for axis, g in enumerate(grads):
            grad_u[..., axis, comp] = g

    strain = 0.5 * (grad_u + np.swapaxes(grad_u, -1, -2))
    modulus = compute_elastic_modulus(initial_positions, params)
    nu = params.nu
    mu = modulus / (2.0 * (1.0 + nu))
    lam = modulus * nu / ((1.0 + nu) * (1.0 - 2.0 * nu))

    trace_strain = np.trace(strain, axis1=-2, axis2=-1)
    identity = np.eye(3)
    stress = (
        lam[..., None, None] * trace_strain[..., None, None] * identity
        + 2.0 * mu[..., None, None] * strain
    )
    mean_stress = trace_strain[..., None, None] / 3.0
    deviator = stress - mean_stress * identity
    von_mises = np.sqrt(1.5 * np.sum(deviator**2, axis=(-2, -1)))

    return von_mises.reshape(-1), von_mises


def voxel_average(
    positions: np.ndarray, von_mises_particles: np.ndarray, grid_size: int = 64
) -> np.ndarray:
    voxels = np.zeros((grid_size, grid_size, grid_size), dtype=np.float64)
    counts = np.zeros_like(voxels)
    idx = np.clip((positions * grid_size).astype(int), 0, grid_size - 1)
    flat_idx = idx[:, 0] * grid_size * grid_size + idx[:, 1] * grid_size + idx[:, 2]
    np.add.at(voxels.reshape(-1), flat_idx, von_mises_particles)
    np.add.at(counts.reshape(-1), flat_idx, 1)
    with np.errstate(invalid="ignore"):
        np.divide(voxels, counts, out=voxels, where=counts > 0)
    return voxels


def save_volume(von_mises_volume: np.ndarray, params: SimulationParams, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    np.savez(
        output_path,
        volume=von_mises_volume,
        grid_size=von_mises_volume.shape[0],
        params={
            "grid_n": params.grid_n,
            "duration_s": params.duration_s,
            "dt": params.dt,
            "rho": params.rho,
            "E_A": params.e_a,
            "E_B": params.e_b,
            "nu": params.nu,
            "contact_damping": params.contact_damping,
        },
    )


def main() -> None:
    params_path = Path(__file__).with_name("params.json")
    params = SimulationParams.from_json(params_path)
    positions, initial_positions, velocities = run_simulation(params)
    von_mises_particles, von_mises_grid = compute_von_mises(positions, initial_positions, params)
    averaged = voxel_average(positions, von_mises_particles, grid_size=64)
    output_path = Path(__file__).with_name("von_mises_t000400.npz")
    save_volume(averaged, params, output_path)
    print(f"Generated von Mises volume at {output_path}")


if __name__ == "__main__":
    main()
