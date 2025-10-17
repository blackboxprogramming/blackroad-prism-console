"""Shared metric utilities for the soft-in-fluid collision study."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Iterable, Tuple

import numpy as np

try:
    import meshio
except ImportError as exc:  # pragma: no cover - hint for optional dependency
    meshio = None

try:
    from scipy.spatial import cKDTree
except ImportError as exc:  # pragma: no cover - hint for optional dependency
    raise SystemExit("scipy is required for Hausdorff distance. Install with `pip install scipy`." ) from exc


def load_points(path: Path) -> np.ndarray:
    if path.suffix == ".npy":
        return np.load(path)
    if path.suffix in {".npz"}:
        data = np.load(path)
        if "points" not in data:
            raise ValueError(f"NPZ file {path} missing 'points' dataset")
        return data["points"]
    if path.suffix in {".vtk", ".vtu", ".ply", ".obj"}:
        if meshio is None:
            raise SystemExit("meshio is required to read mesh files. Install with `pip install meshio`." )
        mesh = meshio.read(path)
        return mesh.points
    raise ValueError(f"Unsupported file format: {path}")


def hausdorff_distance(a: np.ndarray, b: np.ndarray) -> float:
    tree_a = cKDTree(a)
    tree_b = cKDTree(b)
    dist_ab, _ = tree_a.query(b, k=1)
    dist_ba, _ = tree_b.query(a, k=1)
    return float(max(dist_ab.max(), dist_ba.max()))


def median_surface_error(a: np.ndarray, b: np.ndarray) -> float:
    tree_a = cKDTree(a)
    tree_b = cKDTree(b)
    dist_ab, _ = tree_a.query(b, k=1)
    dist_ba, _ = tree_b.query(a, k=1)
    return float(np.median(np.concatenate([dist_ab, dist_ba])))


def compute_mass_drift(mass_series: Iterable[Tuple[float, float]]) -> Dict[str, float]:
    times, masses = zip(*mass_series)
    masses = np.asarray(masses)
    baseline = masses[0]
    drift = (masses - baseline) / baseline * 100.0
    return {
        "baseline_mass": float(baseline),
        "max_percent_drift": float(np.max(np.abs(drift))),
        "final_percent_drift": float(drift[-1]),
    }


def load_mass_csv(path: Path) -> Iterable[Tuple[float, float]]:
    import csv

    with path.open("r", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            yield float(row["time"]), float(row["mass"])


def free_surface_mse(reference: np.ndarray, candidate: np.ndarray) -> float:
    if reference.shape != candidate.shape:
        raise ValueError(f"Shape mismatch: ref {reference.shape} vs cand {candidate.shape}")
    return float(np.mean((reference - candidate) ** 2))


def stress_l2(reference: np.ndarray, candidate: np.ndarray) -> float:
    if reference.shape != candidate.shape:
        raise ValueError("Stress arrays must match shape for L2 computation")
    diff = reference - candidate
    return float(np.sqrt(np.sum(diff ** 2) / reference.size))


def parse_cli() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compute study metrics")
    parser.add_argument("--ref-mesh", type=Path, required=True)
    parser.add_argument("--cand-mesh", type=Path, required=True)
    parser.add_argument("--ref-stress", type=Path, required=False)
    parser.add_argument("--cand-stress", type=Path, required=False)
    parser.add_argument("--ref-surface", type=Path, required=False)
    parser.add_argument("--cand-surface", type=Path, required=False)
    parser.add_argument("--mass-csv", type=Path, required=False,
                        help="CSV with 'time' and 'mass' columns to compute drift")
    parser.add_argument("--output", type=Path, required=False, help="Write metrics JSON here")
    return parser.parse_args()


def main() -> None:
    args = parse_cli()

    ref_points = load_points(args.ref_mesh)
    cand_points = load_points(args.cand_mesh)
    metrics = {
        "hausdorff_mm": hausdorff_distance(ref_points, cand_points) * 1000.0,
        "median_surface_error_mm": median_surface_error(ref_points, cand_points) * 1000.0,
    }

    if args.ref_stress and args.cand_stress:
        ref_stress = np.load(args.ref_stress)
        cand_stress = np.load(args.cand_stress)
        metrics["stress_l2"] = stress_l2(ref_stress, cand_stress)

    if args.ref_surface and args.cand_surface:
        ref_surface = np.load(args.ref_surface)
        cand_surface = np.load(args.cand_surface)
        metrics["free_surface_mse"] = free_surface_mse(ref_surface, cand_surface)

    if args.mass_csv:
        metrics["mass_drift"] = compute_mass_drift(list(load_mass_csv(args.mass_csv)))

    if args.output:
        args.output.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
        print(f"Metrics written to {args.output}")
    else:
        print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
