"""Simplified material point method driver for the solid benchmark.

This script is intentionally lightweight – it mimics the data products of the
full Taichi implementation so downstream tooling can be exercised in a
CPU-only environment. The core loop integrates particle motion under gravity,
applies a damped floor contact, estimates Cauchy stress using a linear elastic
model, and finally exports a voxel-averaged von Mises stress field.
"""
from __future__ import annotations

import csv
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import List, Tuple

import numpy as np


@dataclass(frozen=True)
class SimulationParams:
    grid_n: int
    duration_s: float
    dt: float
    dt_min: float
    cfl_max: float
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
            dt_min=float(data.get("dt_min", 2.0e-5)),
            cfl_max=float(data.get("cfl_max", 0.4)),
            rho=float(data["rho"]),
            e_a=float(data["E_A"]),
            e_b=float(data["E_B"]),
            nu=float(data["nu"]),
            contact_damping=float(data.get("contact_damping", 0.0)),
        )


@dataclass(frozen=True)
class EnergySample:
    step: int
    dt: float
    vmax: float
    cfl_dt: float
    dx: float


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


def get_vmax(velocities: np.ndarray) -> float:
    """Return the maximum grid velocity magnitude."""
    if velocities.size == 0:
        return 0.0
    speed = np.linalg.norm(velocities, axis=1)
    return float(np.max(speed))


def run_simulation(
    params: SimulationParams,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[EnergySample]]:
    positions, initial_positions, velocities = initialize_lattice(params)
    dx = 1.0 / params.grid_n
    dt = params.dt
    dt_min = max(params.dt_min, 0.0)
    total_time = params.duration_s
    gravity = np.array([0.0, 0.0, -9.81], dtype=np.float64)
    log: List[EnergySample] = []
    step = 0
    elapsed = 0.0
    eps = 1.0e-8

    if dt_min == 0.0:
        dt_min = 1.0e-6
    if not math.isfinite(dt) or dt <= 0.0:
        dt = max(params.dt_min, 1.0e-4)

    while elapsed < total_time - 1e-12:
        vmax = get_vmax(velocities)
        cfl_dt = params.cfl_max * dx / (vmax + eps)
        upper = max(cfl_dt, dt_min)
        dt = float(np.clip(dt, dt_min, upper))
        if dt < cfl_dt:
            dt = min(cfl_dt, params.dt)
        dt = min(dt, params.dt)
        remaining = total_time - elapsed
        dt_step = dt if dt < remaining else remaining

        velocities += gravity * dt_step
        positions += velocities * dt_step
        apply_floor_contact(positions, velocities, params.contact_damping)
        positions = np.clip(positions, 0.0, 1.0)
        log.append(
            EnergySample(
                step=step,
                dt=float(dt_step),
                vmax=vmax,
                cfl_dt=float(cfl_dt),
                dx=float(dx),
            )
        )
        elapsed += dt_step
        dt = dt_step
        step += 1

    return positions, initial_positions, velocities, log


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
            "dt_min": params.dt_min,
            "cfl_max": params.cfl_max,
            "rho": params.rho,
            "E_A": params.e_a,
            "E_B": params.e_b,
            "nu": params.nu,
            "contact_damping": params.contact_damping,
        },
    )


def write_energy_log(samples: List[EnergySample], base_dir: Path) -> Path:
    logs_dir = base_dir / "outputs" / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_path = logs_dir / "energy.csv"
    with log_path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["step", "dt", "vmax", "cfl_dt", "dx"])
        for sample in samples:
            writer.writerow([sample.step, sample.dt, sample.vmax, sample.cfl_dt, sample.dx])
    return log_path


def main() -> None:
    params_path = Path(__file__).with_name("params.json")
    params = SimulationParams.from_json(params_path)
    positions, initial_positions, velocities, diagnostics = run_simulation(params)
    von_mises_particles, von_mises_grid = compute_von_mises(positions, initial_positions, params)
    averaged = voxel_average(positions, von_mises_particles, grid_size=64)
    output_path = Path(__file__).with_name("von_mises_t000400.npz")
    save_volume(averaged, params, output_path)
    log_path = write_energy_log(diagnostics, Path(__file__).parent)
    print(f"Generated von Mises volume at {output_path}")
    print(f"CFL diagnostics written to {log_path}")


if __name__ == "__main__":
    main()
