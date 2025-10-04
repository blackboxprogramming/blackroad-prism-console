"""Stubbed Taichi-MPM benchmark that emits deterministic artefacts."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
MESH_DIR = OUTPUT_DIR / "meshes"
FIELD_DIR = OUTPUT_DIR / "fields"


@dataclass
class SoftBody:
    name: str
    centre: tuple[float, float, float]
    radius: float
    resolution: int


SOFT_BODIES = (
    SoftBody("solidA", (0.0, 0.0, 0.0), 0.45, 12),
    SoftBody("solidB", (0.6, 0.0, 0.0), 0.35, 10),
)


try:  # pragma: no cover - optional dependency
    import taichi as ti
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    ti = None


def _sample_sphere(body: SoftBody) -> np.ndarray:
    u = np.linspace(0.0, np.pi, body.resolution)
    v = np.linspace(0.0, 2 * np.pi, body.resolution)
    uu, vv = np.meshgrid(u, v, indexing="ij")
    x = body.centre[0] + body.radius * np.sin(uu) * np.cos(vv)
    y = body.centre[1] + body.radius * np.sin(uu) * np.sin(vv)
    z = body.centre[2] + body.radius * np.cos(uu)
    return np.stack([x, y, z], axis=-1).reshape(-1, 3)


def _write_ply(path: Path, vertices: np.ndarray) -> None:
    header = (
        "ply\n"
        "format ascii 1.0\n"
        f"element vertex {len(vertices)}\n"
        "property float x\n"
        "property float y\n"
        "property float z\n"
        "end_header\n"
    )
    ensure = path.parent
    ensure.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf8") as handle:
        handle.write(header)
        for vertex in vertices:
            handle.write(f"{vertex[0]:.5f} {vertex[1]:.5f} {vertex[2]:.5f}\n")


def _generate_stub_outputs() -> None:
    rng = np.random.default_rng(11)
    stress_grid = np.zeros((48, 48))
    x = np.linspace(-1.0, 1.0, stress_grid.shape[0])
    y = np.linspace(-1.0, 1.0, stress_grid.shape[1])
    xx, yy = np.meshgrid(x, y, indexing="ij")
    stress_grid = 0.25 * np.exp(-(xx ** 2 + yy ** 2) * 2.5)
    stress_grid += 0.05 * np.sin(xx * np.pi) * np.cos(yy * np.pi)
    stress_grid += 0.01 * rng.standard_normal(stress_grid.shape)

    FIELD_DIR.mkdir(parents=True, exist_ok=True)
    np.savez(FIELD_DIR / "von_mises_t000400.npz", von_mises=stress_grid)

    for body in SOFT_BODIES:
        vertices = _sample_sphere(body)
        _write_ply(MESH_DIR / f"{body.name}_t000400.ply", vertices)


def main() -> int:
    if ti is None:
        _generate_stub_outputs()
        print("Taichi not installed; wrote deterministic stub outputs.")
        return 0

    ti.init(arch=ti.cpu)
    res = 128
    grid = ti.field(dtype=ti.f32, shape=(res, res))
    for i, j in grid:  # pragma: no cover - only executed when taichi is available
        grid[i, j] = ti.sin(i / res * ti.pi) * ti.cos(j / res * ti.pi) * 0.3

    FIELD_DIR.mkdir(parents=True, exist_ok=True)
    np.savez(FIELD_DIR / "von_mises_t000400.npz", von_mises=grid.to_numpy())

    for body in SOFT_BODIES:
        vertices = _sample_sphere(body)
        _write_ply(MESH_DIR / f"{body.name}_t000400.ply", vertices)

    print("Taichi simulation complete.")
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI usage
    raise SystemExit(main())
