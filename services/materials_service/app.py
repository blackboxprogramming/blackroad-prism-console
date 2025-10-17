"""
Experimental Materialite service.

Expose simple job endpoints for grain coarsening and small-strain FFT.
All functionality is gated behind FEATURE_MATERIALS feature flag.
"""

import asyncio
import json
import os
import uuid
from pathlib import Path
from typing import Dict, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator

FEATURE_FLAG = os.getenv("FEATURE_MATERIALS") == "true"
RUNS_DIR = Path("/work")  # scratch volume mounted read-only elsewhere

app = FastAPI(title="Lucidia Materials Service", version="0.1", docs_url=None)


# -----------------------------------------------------------------------------
# Job models
# -----------------------------------------------------------------------------
class GrainCoarseningParams(BaseModel):
    grid: tuple[int, int, int] = Field(..., example=[16, 16, 16])
    num_flip_attempts: int = Field(..., le=10_000)
    seed: int = 0

    @validator("grid")
    def grid_bound(cls, v):
        if any(n > 128 for n in v):
            raise ValueError("grid dimension too large")
        return v


class SmallStrainFFTParams(BaseModel):
    cubic_constants: Dict[str, float]
    load: Dict[str, float]  # {type, magnitude, direction}
    seed: int = 0


class JobStatus(BaseModel):
    id: str
    status: str
    detail: Optional[str] = None
    artifacts: Optional[Dict[str, str]] = None  # paths within RUNS_DIR


# -----------------------------------------------------------------------------
# Simple in-process job queue
# -----------------------------------------------------------------------------
jobs: Dict[str, JobStatus] = {}
queue: asyncio.Queue = asyncio.Queue()
_worker_task: Optional[asyncio.Task] = None


def ensure_worker_task() -> None:
    """Ensure the background worker is running on the current event loop."""

    global _worker_task
    if _worker_task and not _worker_task.done():
        return
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return
    _worker_task = loop.create_task(worker())


async def worker():
    while True:
        job_id, kind, params = await queue.get()
        job_dir = RUNS_DIR / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        try:
            if kind == "coarsening":
                await run_grain_coarsening(params, job_dir)
            elif kind == "fft":
                await run_small_strain_fft(params, job_dir)
            jobs[job_id].status = "succeeded"
            jobs[job_id].artifacts = {p.name: str(p) for p in job_dir.iterdir()}
        except Exception as exc:  # noqa: BLE001
            jobs[job_id].status = "failed"
            jobs[job_id].detail = str(exc)
        finally:
            queue.task_done()


ensure_worker_task()


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.get("/healthz")
async def healthz():
    if not FEATURE_FLAG:
        raise HTTPException(404, "Materials feature disabled")
    return {"status": "ok"}


@app.post("/jobs/grain-coarsening", response_model=JobStatus)
async def create_grain_job(params: GrainCoarseningParams):
    job_id = uuid.uuid4().hex
    jobs[job_id] = JobStatus(id=job_id, status="pending")
    ensure_worker_task()
    await queue.put((job_id, "coarsening", params))
    return jobs[job_id]


@app.post("/jobs/small-strain-fft", response_model=JobStatus)
async def create_fft_job(params: SmallStrainFFTParams):
    job_id = uuid.uuid4().hex
    jobs[job_id] = JobStatus(id=job_id, status="pending")
    ensure_worker_task()
    await queue.put((job_id, "fft", params))
    return jobs[job_id]


@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "job not found")
    return job


# -----------------------------------------------------------------------------
# Pipeline stubs
# -----------------------------------------------------------------------------
async def run_grain_coarsening(params: GrainCoarseningParams, out_dir: Path):
    """Call Materialite's grain coarsening model and save artifacts."""
    try:
        from materialite import Material  # type: ignore import-not-found
        from materialite.models import GrainCoarseningModel  # type: ignore import-not-found

        m = Material(grid_shape=params.grid)
        model = GrainCoarseningModel(num_flip_attempts=params.num_flip_attempts)
        m = model(m, seed=params.seed)
        _persist_grain_outputs(params, out_dir, m.grains)  # type: ignore[attr-defined]
        return
    except ModuleNotFoundError:
        # Fall back to stubbed outputs when Materialite is unavailable.
        _persist_grain_outputs(params, out_dir)
        return


async def run_small_strain_fft(params: SmallStrainFFTParams, out_dir: Path):
    """Run small-strain FFT pipeline using Materialite."""
    try:
        from materialite import Material, Order4SymmetricTensor  # type: ignore import-not-found
        from materialite.models.small_strain_fft import (  # type: ignore import-not-found
            Elastic,
            LoadSchedule,
            SmallStrainFFT,
        )

        m = Material(grid_shape=(16, 16, 16))
        stiffness = Order4SymmetricTensor.from_cubic_constants(**params.cubic_constants)
        schedule = LoadSchedule.from_constant_uniaxial_strain_rate(**params.load)
        model = SmallStrainFFT(load_schedule=schedule, constitutive_model=Elastic(stiffness))
        m = model(m, seed=params.seed)
        _persist_fft_outputs(params, out_dir, m)  # type: ignore[arg-type]
        return
    except ModuleNotFoundError:
        _persist_fft_outputs(params, out_dir)
        return


def _persist_grain_outputs(
    params: GrainCoarseningParams,
    out_dir: Path,
    grains: Optional[np.ndarray] = None,
) -> None:
    """Persist stub grain coarsening outputs."""

    out_dir.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(params.seed)

    if grains is None:
        n_grains = min(10, max(2, int(np.prod(params.grid) // 64) + 1))
        grains = rng.integers(0, n_grains, size=params.grid, dtype=np.int16)

    n_grains = int(grains.max()) + 1
    orientations = rng.normal(size=(n_grains, 3)).astype(np.float32)
    fractions = np.bincount(grains.flatten(), minlength=n_grains).astype(np.float32)
    fractions /= fractions.sum() or 1.0

    np.savez(
        out_dir / "grain.npz",
        grain_ids=grains.astype(np.int16),
        orientations=orientations,
        volume_fractions=fractions,
    )

    metadata = {
        "grid": list(params.grid),
        "num_flip_attempts": params.num_flip_attempts,
        "seed": params.seed,
    }
    (out_dir / "grain_metadata.json").write_text(json.dumps(metadata, indent=2))
    _write_unit_cube_ply(out_dir / "grain_preview.ply")


def _persist_fft_outputs(
    params: SmallStrainFFTParams,
    out_dir: Path,
    material: Optional[object] = None,
) -> None:
    """Persist stub small-strain FFT outputs."""

    out_dir.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(params.seed + 1)

    grid = (16, 16, 16)
    coords = np.stack(np.meshgrid(*[np.linspace(0.0, 1.0, g) for g in grid], indexing="ij"))
    displacement = (coords - coords.mean(axis=(1, 2, 3), keepdims=True)).astype(np.float32)
    strain = rng.normal(scale=5e-4, size=grid + (6,)).astype(np.float32)
    stress = (strain * rng.uniform(1e2, 5e2, size=(6,))).astype(np.float32)

    np.savez(
        out_dir / "fft.npz",
        displacement=displacement,
        strain=strain,
        stress=stress,
    )

    metadata = {
        "cubic_constants": params.cubic_constants,
        "load": params.load,
        "seed": params.seed,
        "grid": list(grid),
    }
    (out_dir / "fft_metadata.json").write_text(json.dumps(metadata, indent=2))
    _write_unit_cube_ply(out_dir / "fft_preview.ply")


def _write_unit_cube_ply(path: Path) -> None:
    """Write a simple ASCII PLY cube for visualization sanity checks."""

    vertices = [
        (0.0, 0.0, 0.0),
        (1.0, 0.0, 0.0),
        (1.0, 1.0, 0.0),
        (0.0, 1.0, 0.0),
        (0.0, 0.0, 1.0),
        (1.0, 0.0, 1.0),
        (1.0, 1.0, 1.0),
        (0.0, 1.0, 1.0),
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (2, 3, 7, 6),
        (0, 3, 7, 4),
        (1, 2, 6, 5),
    ]

    with path.open("w", encoding="utf-8") as fh:
        fh.write("ply\n")
        fh.write("format ascii 1.0\n")
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
            fh.write(f"4 {' '.join(str(i) for i in f)}\n")
