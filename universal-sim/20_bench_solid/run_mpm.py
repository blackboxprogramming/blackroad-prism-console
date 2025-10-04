"""Template for running the solid benchmark with Taichi-MPM.

This script is intentionally lightweight—it wires argument parsing, directory layout,
metadata, and export conventions. Replace the placeholder `simulate_with_taichi_mpm`
with your solver-specific implementation.
"""
from __future__ import annotations

import argparse
import json
import math
import time
from pathlib import Path
from typing import Any, Dict

import numpy as np

DEFAULT_MATERIAL = {
    "youngs_modulus": 80_000.0,
    "poisson_ratio": 0.49,
    "density": 1200.0,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Solid benchmark (Taichi-MPM template)")
    parser.add_argument("--output", type=Path, required=True, help="Run directory for outputs.")
    parser.add_argument("--body", choices=["A", "B", "both"], default="both",
                        help="Which bodies to simulate (default both).")
    parser.add_argument("--duration", type=float, default=1.2, help="Simulation duration (s).")
    parser.add_argument("--dt", type=float, default=2.5e-4, help="Time step size (s).")
    parser.add_argument("--particle-spacing", type=float, default=0.0035,
                        help="Material point spacing (m).")
    parser.add_argument("--gravity", nargs=3, type=float, default=[0.0, 0.0, -9.81],
                        help="Gravity vector (m/s^2).")
    parser.add_argument("--viscosity", type=float, default=0.015,
                        help="Fluid viscosity for coupling (if used).")
    parser.add_argument("--notes", type=str, default="", help="Free-form notes to store in metadata.")
    return parser.parse_args()


def ensure_layout(root: Path) -> None:
    (root / "meshes").mkdir(parents=True, exist_ok=True)
    (root / "diagnostics").mkdir(parents=True, exist_ok=True)


def main() -> None:
    args = parse_args()
    ensure_layout(args.output)

    metadata = {
        "solver": "taichi-mpm",
        "parameters": {
            "duration": args.duration,
            "dt": args.dt,
            "particle_spacing": args.particle_spacing,
            "gravity": args.gravity,
            "body": args.body,
        },
        "notes": args.notes,
    }

    start = time.perf_counter()
    results = simulate_with_taichi_mpm(args)
    metadata["wall_time_seconds"] = time.perf_counter() - start

    export_snapshots(results, args.output)
    (args.output / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Run complete. Metadata stored in {args.output / 'metadata.json'}")


def simulate_with_taichi_mpm(args: argparse.Namespace) -> Dict[str, Any]:
    """Placeholder simulation.

    Replace this stub with actual Taichi-MPM calls. Expected return structure:

    ```python
    {
        "snapshots": {
            0.4: {"mesh": <np.ndarray Nx3>, "stress": <np.ndarray Nx1>},
            0.8: {...},
            1.2: {...},
        },
        "contact_events": {"A_floor": 0.37, "A_B": 0.52},
    }
    ```
    """
    # Dummy ellipsoid + sphere point clouds for scaffolding
    times = [0.4, 0.8, 1.2]
    snapshots = {}
    for t in times:
        theta = np.linspace(0, 2 * math.pi, 64)
        phi = np.linspace(0, math.pi, 32)
        x = 0.05 * np.outer(np.cos(theta), np.sin(phi))
        y = 0.05 * np.outer(np.sin(theta), np.sin(phi))
        z = 0.05 * np.outer(np.ones_like(theta), np.cos(phi))
        mesh = np.stack([x.ravel(), y.ravel(), z.ravel()], axis=1)
        stress = np.full(mesh.shape[0], 1_000.0 + 100 * t)
        snapshots[t] = {"mesh": mesh, "stress": stress}
    return {
        "snapshots": snapshots,
        "contact_events": {"A_floor": 0.38, "A_B": 0.55},
    }


def export_snapshots(results: Dict[str, Any], output_dir: Path) -> None:
    import meshio

    mesh_dir = output_dir / "meshes"
    diag_dir = output_dir / "diagnostics"
    for t, data in results["snapshots"].items():
        mesh_path = mesh_dir / f"solid_{t:.1f}s.vtk"
        mesh = meshio.Mesh(points=data["mesh"], cells={})
        mesh.point_data["von_mises"] = data["stress"]
        meshio.write(mesh_path, mesh)
        np.save(diag_dir / f"solid_{t:.1f}s_von_mises.npy", data["stress"])
    (diag_dir / "contact_events.json").write_text(json.dumps(results["contact_events"], indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
