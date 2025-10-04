"""Generate deterministic dummy artefacts for the pipeline warm-up."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

import numpy as np

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"


def _build_control_points(seed: int = 7) -> np.ndarray:
    rng = np.random.default_rng(seed)
    base = rng.normal(loc=0.0, scale=0.35, size=(5, 3))
    base[:, 2] = np.linspace(0.0, 1.0, base.shape[0])
    return base


def _build_timeline(steps: int = 8) -> List[float]:
    return np.linspace(0.0, 0.4, steps).round(4).tolist()


def _build_metadata(control_points: np.ndarray, timeline: List[float]) -> Dict:
    return {
        "seed": 7,
        "control_points": control_points.round(4).tolist(),
        "timeline": timeline,
        "note": "Deterministic dummy scene for CI warm-up.",
    }


def generate_dummy_scene() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    control_points = _build_control_points()
    timeline = _build_timeline()
    metadata = _build_metadata(control_points, timeline)

    (OUTPUT_DIR / "dummy_scene.json").write_text(json.dumps(metadata, indent=2))
    np.save(OUTPUT_DIR / "control_points.npy", control_points)

    heightmap = np.sin(control_points[:, None, 2] + np.linspace(0, np.pi, 32)) * 0.1
    np.save(OUTPUT_DIR / "heightmap_seed.npy", heightmap)


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--mode",
        default="dummy",
        choices=["dummy", "genesis"],
        help="Select the generation template to emit.",
    )
    args = parser.parse_args(argv)

    generate_dummy_scene()
    if args.mode == "genesis":
        (OUTPUT_DIR / "genesis_marker.txt").write_text("genesis")
    print("Dummy artefacts written to", OUTPUT_DIR.relative_to(BASE_DIR))
    return 0


if __name__ == "__main__":  # pragma: no cover - manual execution
    raise SystemExit(main())
