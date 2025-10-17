"""Run the materials service stub pipelines and summarize outputs."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ROOT_STR = str(ROOT)
if ROOT_STR not in sys.path:
    sys.path.insert(0, ROOT_STR)

from services.materials_service.app import (
    GrainCoarseningParams,
    SmallStrainFFTParams,
    run_grain_coarsening,
    run_small_strain_fft,
)


ARTIFACT_ROOT = Path("artifacts/materials_stub")


def _summarize_npz(path: Path) -> dict[str, tuple[int, ...]]:
    with np.load(path) as data:
        return {key: tuple(data[key].shape) for key in data.files}


async def _run_grain(out_dir: Path) -> dict[str, tuple[int, ...]]:
    params = GrainCoarseningParams(grid=(8, 8, 8), num_flip_attempts=128, seed=7)
    await run_grain_coarsening(params, out_dir)
    return _summarize_npz(out_dir / "grain.npz")


async def _run_fft(out_dir: Path) -> dict[str, tuple[int, ...]]:
    params = SmallStrainFFTParams(
        cubic_constants={"C11": 240.0, "C12": 125.0, "C44": 110.0},
        load={"magnitude": 1e-3, "direction_x": 1.0, "direction_y": 0.0, "direction_z": 0.0},
        seed=3,
    )
    await run_small_strain_fft(params, out_dir)
    return _summarize_npz(out_dir / "fft.npz")


async def main() -> None:
    grain_dir = ARTIFACT_ROOT / "grain"
    fft_dir = ARTIFACT_ROOT / "fft"

    grain_dir.mkdir(parents=True, exist_ok=True)
    fft_dir.mkdir(parents=True, exist_ok=True)

    grain_summary, fft_summary = await asyncio.gather(
        _run_grain(grain_dir),
        _run_fft(fft_dir),
    )

    print("Grain artifacts:")
    for name, shape in grain_summary.items():
        print(f"  {name}: {shape}")

    print("FFT artifacts:")
    for name, shape in fft_summary.items():
        print(f"  {name}: {shape}")

    other_artifacts = sorted(
        p.relative_to(ARTIFACT_ROOT)
        for p in ARTIFACT_ROOT.rglob("*")
        if p.is_file() and p.suffix in {".json", ".ply"}
    )
    for path in other_artifacts:
        print(f"  Generated {path}")


if __name__ == "__main__":
    asyncio.run(main())
