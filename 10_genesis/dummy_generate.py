"""Utility to generate synthetic Genesis artifacts for local testing.

This script fabricates mesh, volume, and video artifacts so the rest of the
pipeline can be exercised without a physics engine.  The output is written to
``10_genesis/outputs/<timestamp>`` with default timestamp ``t000400``.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict

import numpy as np

# A single-frame MP4 encoded as base64.  This keeps the script self-contained
# and avoids needing ffmpeg on the host.
_PLACEHOLDER_MP4 = (
    b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41\x00\x00\x00\x08free"
    b"\x00\x00\x00,mdat\x00\x00\x00\x01\x00\x00\x00\x01"
)


def _write_mesh(path: Path, name: str) -> None:
    """Create a minimal ASCII PLY mesh for debugging."""
    vertices = [
        (0.0, 0.0, 0.0),
        (1.0, 0.0, 0.0),
        (1.0, 1.0, 0.0),
        (0.0, 1.0, 0.0),
    ]
    faces = [(0, 1, 2), (0, 2, 3)]

    with path.open("w", encoding="utf-8") as fh:
        fh.write("ply\n")
        fh.write("format ascii 1.0\n")
        fh.write(f"comment synthetic mesh for {name}\n")
        fh.write(f"element vertex {len(vertices)}\n")
        fh.write("property float x\n")
        fh.write("property float y\n")
        fh.write("property float z\n")
        fh.write(f"element face {len(faces)}\n")
        fh.write("property list uchar int vertex_indices\n")
        fh.write("end_header\n")
        for v in vertices:
            fh.write(f"{v[0]} {v[1]} {v[2]}\n")
        for f in faces:
            fh.write(f"3 {f[0]} {f[1]} {f[2]}\n")


def _create_solid_volume(grid: np.ndarray) -> Dict[str, np.ndarray]:
    x, y, z = grid
    displacement = np.stack([
        np.sin(x / 10.0),
        np.cos(y / 10.0),
        np.sin(z / 15.0),
    ], axis=-1)
    stress = 0.1 + 0.05 * np.sin((x + y + z) / 8.0)
    return {
        "displacement": displacement.astype(np.float32),
        "stress": stress.astype(np.float32),
    }


def _create_fluid_volume(grid: np.ndarray) -> Dict[str, np.ndarray]:
    x, y, z = grid
    density = 1.0 + 0.02 * np.cos((x - y) / 12.0)
    vx = 0.1 * np.sin(x / 20.0)
    vy = 0.1 * np.sin(y / 18.0)
    vz = 0.05 * np.cos(z / 25.0)
    velocity = np.stack([vx, vy, vz], axis=-1)
    return {
        "density": density.astype(np.float32),
        "velocity": velocity.astype(np.float32),
    }


def _write_video(path: Path) -> None:
    path.write_bytes(_PLACEHOLDER_MP4)


def generate(timestamp: str, out_dir: Path, grid_shape: int) -> Path:
    """Generate the synthetic dataset and return the output directory."""
    output_root = out_dir / timestamp
    output_root.mkdir(parents=True, exist_ok=True)

    # Meshes
    _write_mesh(output_root / "solid_surface.ply", "solid_surface")
    _write_mesh(output_root / "fluid_surface.ply", "fluid_surface")

    grid = np.indices((grid_shape, grid_shape, grid_shape))

    # Volumes
    solid = _create_solid_volume(grid)
    fluid = _create_fluid_volume(grid)
    np.savez_compressed(output_root / "solid_volume.npz", **solid)
    np.savez_compressed(output_root / "fluid_volume.npz", **fluid)

    # Diagnostics video placeholder
    _write_video(output_root / "diagnostics.mp4")

    # Metadata for traceability
    metadata = {
        "timestamp": timestamp,
        "grid_shape": grid_shape,
        "fields": {
            "solid_volume": list(solid.keys()),
            "fluid_volume": list(fluid.keys()),
        },
    }
    (output_root / "metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )

    return output_root


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--timestamp",
        default="t000400",
        help="Timestamp identifier for the synthetic run.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).parent / "outputs",
        help="Root directory for generated artifacts.",
    )
    parser.add_argument(
        "--grid",
        type=int,
        default=48,
        help="Resolution of the generated 3D grid.",
    )
    args = parser.parse_args()

    output = generate(args.timestamp, args.out_dir, args.grid)
    print(f"Synthetic Genesis artifacts written to {output}")


if __name__ == "__main__":
    main()
