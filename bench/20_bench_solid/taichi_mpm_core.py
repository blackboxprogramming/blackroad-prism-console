from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence

import numpy as np
import taichi as ti


@dataclass
class SolidSpec:
    """Material description for a single solid block."""

    name: str
    center: Sequence[float]
    extent: Sequence[float]
    youngs_modulus: float
    poisson_ratio: float
    density: float


@dataclass
class SimulationParams:
    """Container for MPM simulation knobs."""

    grid_n: int
    dt: float
    steps: int
    particles_per_edge: int
    gravity: Sequence[float]
    floor_height: float
    solids: List[SolidSpec]


def lame_parameters(youngs_modulus: float, poisson_ratio: float) -> tuple[float, float]:
    mu = youngs_modulus / (2.0 * (1.0 + poisson_ratio))
    la = youngs_modulus * poisson_ratio / ((1.0 + poisson_ratio) * (1.0 - 2.0 * poisson_ratio))
    return mu, la


def load_params(path: Path) -> SimulationParams:
    data = json.loads(path.read_text())
    solids = []
    for name, spec in data.get("solids", {}).items():
        solids.append(
            SolidSpec(
                name=name,
                center=spec.get("center", [0.5, 0.5, 0.5]),
                extent=spec.get("extent", [0.2, 0.2, 0.2]),
                youngs_modulus=float(spec.get("youngs_modulus", 1.0e5)),
                poisson_ratio=float(spec.get("poisson_ratio", 0.3)),
                density=float(spec.get("density", 1000.0)),
            )
        )
    if not solids:
        raise ValueError("At least one solid must be described in params.json")
    return SimulationParams(
        grid_n=int(data.get("grid_n", 64)),
        dt=float(data.get("dt", 2.5e-4)),
        steps=int(data.get("steps", 400)),
        particles_per_edge=int(data.get("particles_per_edge", 16)),
        gravity=data.get("gravity", [0.0, -9.81, 0.0]),
        floor_height=float(data.get("floor_height", 0.0)),
        solids=solids,
    )


def _cube_positions(center: Sequence[float], extent: Sequence[float], per_edge: int) -> np.ndarray:
    center_v = np.asarray(center, dtype=np.float32)
    extent_v = np.asarray(extent, dtype=np.float32)
    lower = center_v - 0.5 * extent_v
    step = extent_v / per_edge
    axes = [np.linspace(lower[d] + 0.5 * step[d], lower[d] + extent_v[d] - 0.5 * step[d], per_edge) for d in range(3)]
    grid = np.stack(np.meshgrid(*axes, indexing="ij"), axis=-1)
    return grid.reshape(-1, 3)


def _ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


@ti.data_oriented
class MPMSolver:
    def __init__(self, params: SimulationParams) -> None:
        self.params = params
        self.dim = 3
        self.n_grid = params.grid_n
        self.dx = 1.0 / self.n_grid
        self.inv_dx = float(self.n_grid)
        self.dt = params.dt
        self.floor_height = params.floor_height
        self.floor_cell = max(0, min(self.n_grid - 1, int(self.floor_height * self.n_grid)))
        self.num_solids = len(params.solids)
        self.particles_per_edge = params.particles_per_edge
        self.n_particles = self.particles_per_edge ** 3 * self.num_solids

        self.grid_v = ti.Vector.field(self.dim, dtype=ti.f32, shape=(self.n_grid, self.n_grid, self.n_grid))
        self.grid_m = ti.field(dtype=ti.f32, shape=(self.n_grid, self.n_grid, self.n_grid))

        self.particle_x = ti.Vector.field(self.dim, dtype=ti.f32, shape=self.n_particles)
        self.particle_v = ti.Vector.field(self.dim, dtype=ti.f32, shape=self.n_particles)
        self.particle_C = ti.Matrix.field(self.dim, self.dim, dtype=ti.f32, shape=self.n_particles)
        self.particle_F = ti.Matrix.field(self.dim, self.dim, dtype=ti.f32, shape=self.n_particles)
        self.particle_mass = ti.field(dtype=ti.f32, shape=self.n_particles)
        self.particle_vol = ti.field(dtype=ti.f32, shape=self.n_particles)
        self.particle_material = ti.field(dtype=ti.i32, shape=self.n_particles)

        self.material_mu = ti.field(dtype=ti.f32, shape=self.num_solids)
        self.material_lambda = ti.field(dtype=ti.f32, shape=self.num_solids)
        self.von_mises = ti.field(dtype=ti.f32, shape=self.n_particles)
        self.gravity = ti.Vector.field(self.dim, dtype=ti.f32, shape=())

        self._init_state()

    def _init_state(self) -> None:
        mu_values: List[float] = []
        lambda_values: List[float] = []
        positions: List[np.ndarray] = []
        volumes: List[np.ndarray] = []
        masses: List[np.ndarray] = []
        materials: List[np.ndarray] = []

        for material_id, solid in enumerate(self.params.solids):
            mu, la = lame_parameters(solid.youngs_modulus, solid.poisson_ratio)
            mu_values.append(mu)
            lambda_values.append(la)

            pos = _cube_positions(solid.center, solid.extent, self.particles_per_edge)
            positions.append(pos)
            volume = (np.prod(np.asarray(solid.extent, dtype=np.float32)) / (self.particles_per_edge ** 3))
            volumes.append(np.full((pos.shape[0],), volume, dtype=np.float32))
            masses.append(np.full((pos.shape[0],), volume * solid.density, dtype=np.float32))
            materials.append(np.full((pos.shape[0],), material_id, dtype=np.int32))

        all_positions = np.concatenate(positions, axis=0)
        all_volumes = np.concatenate(volumes, axis=0)
        all_masses = np.concatenate(masses, axis=0)
        all_materials = np.concatenate(materials, axis=0)

        self.particle_x.from_numpy(all_positions.astype(np.float32))
        self.particle_v.fill(ti.Vector.zero(ti.f32, self.dim))
        self.particle_C.fill(ti.Matrix.zero(ti.f32, self.dim, self.dim))
        self.particle_F.fill(ti.Matrix.identity(ti.f32, self.dim))
        self.particle_mass.from_numpy(all_masses.astype(np.float32))
        self.particle_vol.from_numpy(all_volumes.astype(np.float32))
        self.particle_material.from_numpy(all_materials.astype(np.int32))

        self.material_mu.from_numpy(np.asarray(mu_values, dtype=np.float32))
        self.material_lambda.from_numpy(np.asarray(lambda_values, dtype=np.float32))
        self.gravity[None] = ti.Vector(self.params.gravity)

    @ti.kernel
    def substep(self) -> None:
        for I in ti.grouped(self.grid_m):
            self.grid_v[I] = ti.Vector.zero(ti.f32, self.dim)
            self.grid_m[I] = 0.0

        for p in range(self.n_particles):
            base = (self.particle_x[p] * self.inv_dx - 0.5).cast(int)
            fx = self.particle_x[p] * self.inv_dx - base.cast(float)
            w = [
                0.5 * (1.5 - fx) ** 2,
                0.75 - (fx - 1.0) ** 2,
                0.5 * (fx - 0.5) ** 2,
            ]

            F = self.particle_F[p]
            F = (ti.Matrix.identity(ti.f32, self.dim) + self.dt * self.particle_C[p]) @ F
            self.particle_F[p] = F

            J = F.determinant()
            mu = self.material_mu[self.particle_material[p]]
            la = self.material_lambda[self.particle_material[p]]
            R, _ = ti.polar_decompose(F)
            stress = 2 * mu * (F - R) @ F.transpose() + ti.Matrix.identity(ti.f32, self.dim) * la * (J - 1.0) * J
            stress *= -self.dt * self.particle_vol[p] * 4.0 * self.inv_dx * self.inv_dx
            affine = stress + self.particle_mass[p] * self.particle_C[p]
            mass = self.particle_mass[p]

            for offset in ti.grouped(ti.ndrange(3, 3, 3)):
                grid_idx = base + offset
                if 0 <= grid_idx.x < self.n_grid and 0 <= grid_idx.y < self.n_grid and 0 <= grid_idx.z < self.n_grid:
                    dpos = (offset.cast(float) - fx) * self.dx
                    weight = w[offset.x].x * w[offset.y].y * w[offset.z].z
                    self.grid_v[grid_idx] += weight * (mass * self.particle_v[p] + affine @ dpos)
                    self.grid_m[grid_idx] += weight * mass

        for I in ti.grouped(self.grid_m):
            if self.grid_m[I] > 0:
                v = self.grid_v[I] / self.grid_m[I]
                v += self.dt * self.gravity[None]
                if I.y <= self.floor_cell and v.y < 0:
                    v.y = 0
                    v.x *= 0.5
                    v.z *= 0.5
                if I.x < 2 and v.x < 0:
                    v.x = 0
                if I.x > self.n_grid - 3 and v.x > 0:
                    v.x = 0
                if I.z < 2 and v.z < 0:
                    v.z = 0
                if I.z > self.n_grid - 3 and v.z > 0:
                    v.z = 0
                self.grid_v[I] = v

        for p in range(self.n_particles):
            base = (self.particle_x[p] * self.inv_dx - 0.5).cast(int)
            fx = self.particle_x[p] * self.inv_dx - base.cast(float)
            w = [
                0.5 * (1.5 - fx) ** 2,
                0.75 - (fx - 1.0) ** 2,
                0.5 * (fx - 0.5) ** 2,
            ]

            new_v = ti.Vector.zero(ti.f32, self.dim)
            new_C = ti.Matrix.zero(ti.f32, self.dim, self.dim)
            for offset in ti.grouped(ti.ndrange(3, 3, 3)):
                grid_idx = base + offset
                if 0 <= grid_idx.x < self.n_grid and 0 <= grid_idx.y < self.n_grid and 0 <= grid_idx.z < self.n_grid:
                    weight = w[offset.x].x * w[offset.y].y * w[offset.z].z
                    g_v = self.grid_v[grid_idx]
                    new_v += weight * g_v
                    new_C += 4 * self.inv_dx * weight * ti.outer_product(g_v, offset.cast(float) - fx)

            self.particle_v[p] = new_v
            self.particle_C[p] = new_C
            self.particle_x[p] += self.dt * new_v

            if self.particle_x[p].y < self.floor_height + 1e-3:
                self.particle_x[p].y = self.floor_height + 1e-3
            for c in ti.static(range(self.dim)):
                self.particle_x[p][c] = ti.min(0.98, ti.max(0.02, self.particle_x[p][c]))

    @ti.kernel
    def compute_von_mises(self) -> None:
        for p in range(self.n_particles):
            F = self.particle_F[p]
            R, _ = ti.polar_decompose(F)
            dev = F - R
            self.von_mises[p] = ti.sqrt(1.5) * dev.norm()

    def run(self) -> None:
        for _ in range(self.params.steps):
            self.substep()
        self.compute_von_mises()

    def particles_numpy(self) -> np.ndarray:
        return self.particle_x.to_numpy()

    def materials_numpy(self) -> np.ndarray:
        return self.particle_material.to_numpy()

    def von_mises_numpy(self) -> np.ndarray:
        return self.von_mises.to_numpy()


def write_ply(path: Path, points: np.ndarray) -> None:
    header = [
        "ply",
        "format ascii 1.0",
        f"element vertex {len(points)}",
        "property float x",
        "property float y",
        "property float z",
        "end_header",
    ]
    body = "\n".join("{:.6f} {:.6f} {:.6f}".format(*p) for p in points)
    path.write_text("\n".join(header + ([body] if body else [])), encoding="utf-8")


def save_meshes(output_root: Path, positions: np.ndarray, materials: np.ndarray, solids: Iterable[SolidSpec], steps: int) -> None:
    mesh_dir = _ensure_dir(output_root / "meshes")
    for material_id, solid in enumerate(solids):
        solid_positions = positions[materials == material_id]
        target_path = mesh_dir / f"{solid.name}_t{steps:06d}.ply"
        write_ply(target_path, solid_positions)


def save_von_mises_volume(output_root: Path, positions: np.ndarray, values: np.ndarray, grid_n: int, steps: int) -> None:
    field_dir = _ensure_dir(output_root / "fields")
    grid = np.zeros((grid_n, grid_n, grid_n), dtype=np.float32)
    counts = np.zeros_like(grid)
    scaled = np.clip((positions * grid_n).astype(int), 0, grid_n - 1)
    for idx, value in zip(scaled, values):
        ix, iy, iz = idx
        grid[ix, iy, iz] += value
        counts[ix, iy, iz] += 1
    mask = counts > 0
    grid[mask] /= counts[mask]
    np.savez_compressed(field_dir / f"von_mises_t{steps:06d}.npz", field=grid)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Minimal Taichi MPM Neo-Hookean benchmark")
    parser.add_argument("--params", type=Path, default=Path(__file__).with_name("params.json"), help="Path to parameter JSON file")
    parser.add_argument("--grid-n", type=int, help="Override the grid resolution")
    parser.add_argument("--dt", type=float, help="Override simulation timestep")
    parser.add_argument("--steps", type=int, help="Override simulation step count")
    parser.add_argument("--particles-per-edge", type=int, help="Override particle sampling per edge for each solid")
    parser.add_argument("--output-root", type=Path, default=Path("outputs"), help="Output directory root")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    params = load_params(args.params)
    if args.grid_n is not None:
        params.grid_n = args.grid_n
    if args.dt is not None:
        params.dt = args.dt
    if args.steps is not None:
        params.steps = args.steps
    if args.particles_per_edge is not None:
        params.particles_per_edge = args.particles_per_edge

    ti.init(arch=ti.cpu, default_fp=ti.f32)
    solver = MPMSolver(params)
    solver.run()

    positions = solver.particles_numpy()
    materials = solver.materials_numpy()
    von_mises = solver.von_mises_numpy()

    output_root = _ensure_dir(args.output_root)
    save_meshes(output_root, positions, materials, params.solids, params.steps)
    save_von_mises_volume(output_root, positions, von_mises, params.grid_n, params.steps)

    print(f"Completed MPM run: steps={params.steps}, grid={params.grid_n}, particles={positions.shape[0]}")
    print(f"Meshes written to: {(output_root / 'meshes').resolve()}")
    print(f"Fields written to: {(output_root / 'fields').resolve()}")


if __name__ == "__main__":
    main()
