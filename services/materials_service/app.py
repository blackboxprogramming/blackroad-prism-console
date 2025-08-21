"""
Experimental Materialite service.

Expose simple job endpoints for grain coarsening and small-strain FFT.
All functionality is gated behind FEATURE_MATERIALS feature flag.
"""

import os
import uuid
import asyncio
from pathlib import Path
from typing import Dict, Optional

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


def create_worker_task() -> asyncio.Task:
    return asyncio.create_task(worker())


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


create_worker_task()


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
    await queue.put((job_id, "coarsening", params))
    return jobs[job_id]


@app.post("/jobs/small-strain-fft", response_model=JobStatus)
async def create_fft_job(params: SmallStrainFFTParams):
    job_id = uuid.uuid4().hex
    jobs[job_id] = JobStatus(id=job_id, status="pending")
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
    from materialite import Material
    from materialite.models import GrainCoarseningModel

    m = Material(grid_shape=params.grid)
    model = GrainCoarseningModel(num_flip_attempts=params.num_flip_attempts)
    m = model(m, seed=params.seed)

    # TODO: save npz/PNG previews as required
    (out_dir / "grain.npz").write_bytes(b"")


async def run_small_strain_fft(params: SmallStrainFFTParams, out_dir: Path):
    """Run small-strain FFT pipeline using Materialite."""
    from materialite import Material, Order4SymmetricTensor
    from materialite.models.small_strain_fft import (
        SmallStrainFFT,
        Elastic,
        LoadSchedule,
    )

    m = Material(grid_shape=(16, 16, 16))
    stiffness = Order4SymmetricTensor.from_cubic_constants(**params.cubic_constants)
    schedule = LoadSchedule.from_constant_uniaxial_strain_rate(**params.load)
    model = SmallStrainFFT(load_schedule=schedule, constitutive_model=Elastic(stiffness))
    m = model(m, seed=params.seed)

    # TODO: save npz/PNG previews as required
    (out_dir / "fft.npz").write_bytes(b"")
