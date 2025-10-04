"""Prototype Taichi-driven soft body deformation exporter."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Dict

import numpy as np

try:
    import taichi as ti  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    ti = None

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from universal_sim.paths import PATHS
from universal_sim.stubs import solid as solid_stub


def _run_taichi(resolution: int, steps: int = 60, dt: float = 1.0 / 60.0) -> Dict[str, np.ndarray]:
    if ti is None:
        raise RuntimeError("Taichi not installed")
    ti.init(arch=ti.cpu)
    n = resolution ** 3
    positions = ti.Vector.field(3, dtype=ti.f32, shape=n)
    displacement = ti.Vector.field(3, dtype=ti.f32, shape=n)
    von_mises = ti.field(dtype=ti.f32, shape=n)
    coords = np.stack(np.meshgrid(
        np.linspace(-0.5, 0.5, resolution),
        np.linspace(-0.5, 0.5, resolution),
        np.linspace(-0.5, 0.5, resolution),
        indexing="ij",
    ), axis=-1).reshape(-1, 3)
    positions.from_numpy(coords.astype(np.float32))

    @ti.kernel
    def substep(time: ti.f32):
        for i in positions:
            pos = positions[i]
            drift = ti.Vector([
                0.08 * pos.x,
                -0.12 * pos.y,
                0.05 * ti.sin(3.1415926 * pos.x + time),
            ])
            wobble = 0.02 * ti.sin(time * 6.28318 + pos.z * 3.1415)
            displacement[i] = drift + ti.Vector([0.0, wobble, 0.0])
            von_mises[i] = ti.sqrt(displacement[i].dot(displacement[i])) * 6.0

    for step in range(steps):
        substep(step * dt)

    disp = displacement.to_numpy().reshape(resolution, resolution, resolution, 3)
    stress = von_mises.to_numpy().reshape(resolution, resolution, resolution)
    return {
        "displacement_t000400.npz": disp.astype(np.float32),
        "von_mises_t000400.npy": stress.astype(np.float32),
    }


def run(output_dir: Path, resolution: int = 20, prefer_stub: bool = False) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    try:
        if prefer_stub:
            raise RuntimeError("Stub mode forced")
        fields = _run_taichi(resolution)
        print("Taichi deformation field generated.")
    except Exception as exc:
        print(f"[fallback] Using synthetic lattice deformation due to: {exc}")
        fields = solid_stub.benchmark_fields(resolution)
    solid_stub.save_fields(fields, output_dir)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=PATHS.bench_solid)
    parser.add_argument("--resolution", type=int, default=20)
    parser.add_argument("--force-stub", action="store_true", dest="force_stub")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    run(args.output, resolution=args.resolution, prefer_stub=args.force_stub)


if __name__ == "__main__":
    main()
