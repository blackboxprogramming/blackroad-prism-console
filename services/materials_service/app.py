"""Experimental Materialite service with observability hooks."""

import asyncio
import os
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Deque, Dict, Optional

from fastapi import FastAPI, HTTPException, Request
from opentelemetry import trace
from pydantic import BaseModel, Field, validator

from services.materials_service.telemetry import configure_telemetry

FEATURE_FLAG = os.getenv("FEATURE_MATERIALS") == "true"
RUNS_DIR = Path("/work")  # scratch volume mounted read-only elsewhere
RATE_WINDOW_SECONDS = int(os.getenv("MATERIALS_RATE_WINDOW_SECONDS", "60"))
AUDIT_LOG_SIZE = int(os.getenv("MATERIALS_AUDIT_LOG_SIZE", "256"))
START_TIME = time.time()

app = FastAPI(title="Lucidia Materials Service", version="0.1", docs_url=None)
configure_telemetry(app)

tracer = trace.get_tracer(__name__)
request_events: Deque[float] = deque()
audit_log: Deque[Dict[str, Any]] = deque(maxlen=max(1, AUDIT_LOG_SIZE))


def _format_trace_id(trace_id: int) -> Optional[str]:
    if not trace_id:
        return None
    return f"{trace_id:032x}"


def current_trace_id() -> Optional[str]:
    span = trace.get_current_span()
    if not span:
        return None
    return _format_trace_id(span.get_span_context().trace_id)


def record_audit(action: str, job_id: str, **metadata: Any) -> None:
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "job_id": job_id,
        "trace_id": current_trace_id(),
    }
    if metadata:
        entry["metadata"] = metadata
    audit_log.append(entry)


@app.middleware("http")
async def enrich_response(request: Request, call_next):
    response = await call_next(request)
    now = time.time()
    request_events.append(now)
    cutoff = now - RATE_WINDOW_SECONDS
    while request_events and request_events[0] < cutoff:
        request_events.popleft()

    trace_id = current_trace_id()
    if trace_id:
        response.headers["x-trace-id"] = trace_id
        request.state.trace_id = trace_id
    return response


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

        with tracer.start_as_current_span(
            f"job.{kind}", attributes={"job.id": job_id, "job.kind": kind}
        ):
            record_audit("job.started", job_id, kind=kind)
            try:
                if kind == "coarsening":
                    await run_grain_coarsening(params, job_dir)
                elif kind == "fft":
                    await run_small_strain_fft(params, job_dir)
                jobs[job_id].status = "succeeded"
                jobs[job_id].artifacts = {p.name: str(p) for p in job_dir.iterdir()}
                record_audit("job.succeeded", job_id, kind=kind)
            except Exception as exc:  # noqa: BLE001
                jobs[job_id].status = "failed"
                jobs[job_id].detail = str(exc)
                record_audit("job.failed", job_id, kind=kind, error=str(exc))
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
    now = time.time()
    exporter = "otlp" if os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT") else "console"
    return {
        "status": "ok",
        "service": "lucidia-materials",
        "build": {
            "sha": os.getenv("BUILD_SHA", "dev"),
            "timestamp": os.getenv("BUILD_TIMESTAMP"),
        },
        "uptime_s": round(now - START_TIME, 2),
        "queue": {
            "depth": queue.qsize(),
            "jobs": len(jobs),
        },
        "rate_limit": {
            "window_seconds": RATE_WINDOW_SECONDS,
            "recent_requests": len(request_events),
        },
        "telemetry": {
            "exporter": exporter,
            "provider": type(trace.get_tracer_provider()).__name__,
        },
        "audit": {
            "recent_records": len(audit_log),
            "capacity": audit_log.maxlen,
        },
    }


@app.get("/audit/logs")
async def get_audit_logs(limit: int = 50):
    if not FEATURE_FLAG:
        raise HTTPException(404, "Materials feature disabled")
    limit = max(1, min(limit, len(audit_log))) if audit_log else 0
    if limit == 0:
        return []
    return list(audit_log)[-limit:]


@app.post("/jobs/grain-coarsening", response_model=JobStatus)
async def create_grain_job(params: GrainCoarseningParams):
    job_id = uuid.uuid4().hex
    jobs[job_id] = JobStatus(id=job_id, status="pending")
    await queue.put((job_id, "coarsening", params))
    record_audit("job.enqueued", job_id, kind="coarsening")
    return jobs[job_id]


@app.post("/jobs/small-strain-fft", response_model=JobStatus)
async def create_fft_job(params: SmallStrainFFTParams):
    job_id = uuid.uuid4().hex
    jobs[job_id] = JobStatus(id=job_id, status="pending")
    await queue.put((job_id, "fft", params))
    record_audit("job.enqueued", job_id, kind="fft")
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
