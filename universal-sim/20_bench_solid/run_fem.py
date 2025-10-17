"""Finite element benchmark template using FEniCS/DOLFINx conventions.

The script stubs out mesh generation, material setup, and export steps so you can drop
in your solver-specific code. Replace the placeholders with actual FEniCS calls.
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any, Dict

import numpy as np


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Solid FEM benchmark template")
    parser.add_argument("--output", type=Path, required=True, help="Run directory for outputs.")
    parser.add_argument("--resolution", type=int, default=36, help="Mesh resolution parameter.")
    parser.add_argument("--duration", type=float, default=1.2)
    parser.add_argument("--dt", type=float, default=2.5e-4)
    parser.add_argument("--notes", type=str, default="")
    return parser.parse_args()


def ensure_layout(root: Path) -> None:
    (root / "meshes").mkdir(parents=True, exist_ok=True)
    (root / "diagnostics").mkdir(parents=True, exist_ok=True)


def main() -> None:
    args = parse_args()
    ensure_layout(args.output)

    metadata = {
        "solver": "fenics",
        "parameters": {
            "resolution": args.resolution,
            "duration": args.duration,
            "dt": args.dt,
        },
        "notes": args.notes,
    }

    start = time.perf_counter()
    results = simulate_with_fem(args)
    metadata["wall_time_seconds"] = time.perf_counter() - start

    export_snapshots(results, args.output)
    (args.output / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"FEM run stored in {args.output}")


def simulate_with_fem(args: argparse.Namespace) -> Dict[str, Any]:
    times = [0.4, 0.8, 1.2]
    snapshots = {}
    for t in times:
        # Replace with FEniCS mesh export; this placeholder is a simple ellipsoid cloud.
        u = np.linspace(0, 2 * np.pi, 64)
        v = np.linspace(0, np.pi, 32)
        x = 0.06 * np.outer(np.cos(u), np.sin(v))
        y = 0.04 * np.outer(np.sin(u), np.sin(v))
        z = 0.04 * np.outer(np.ones_like(u), np.cos(v))
        mesh = np.stack([x.ravel(), y.ravel(), z.ravel()], axis=1)
        stress = np.full(mesh.shape[0], 600.0 + 75 * t)
        snapshots[t] = {"mesh": mesh, "stress": stress}
    return {
        "snapshots": snapshots,
        "contact_events": {"A_floor": 0.39, "A_B": 0.53},
    }


def export_snapshots(results: Dict[str, Any], output_dir: Path) -> None:
    import meshio

    mesh_dir = output_dir / "meshes"
    diag_dir = output_dir / "diagnostics"
    for t, data in results["snapshots"].items():
        mesh_path = mesh_dir / f"fem_{t:.1f}s.vtk"
        mesh = meshio.Mesh(points=data["mesh"], cells={})
        mesh.point_data["von_mises"] = data["stress"]
        meshio.write(mesh_path, mesh)
        np.save(diag_dir / f"fem_{t:.1f}s_von_mises.npy", data["stress"])
    (diag_dir / "contact_events.json").write_text(json.dumps(results["contact_events"], indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
