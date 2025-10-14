"""Job orchestration endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from ...config import get_settings
from ...schemas import JobCreate, JobDetail, JobListItem, JobState, TelemetryPoint

router = APIRouter()


class _JobStore:
    """Temporary job registry used for the prototype."""

    def __init__(self) -> None:
        self._items: Dict[str, JobDetail] = {}

    def list(self) -> list[JobListItem]:
        return [
            JobListItem(
                id=item.id,
                state=item.state,
                started_at=item.started_at,
                stopped_at=item.stopped_at,
                cost_usd=item.cost_usd,
                budget_cap_usd=item.budget_cap_usd,
            )
            for item in self._items.values()
        ]

    def get(self, job_id: str) -> JobDetail:
        try:
            return self._items[job_id]
        except KeyError as exc:  # pragma: no cover
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND) from exc

    def create(self, payload: JobCreate) -> JobDetail:
        job_id = str(uuid4())
        now = datetime.utcnow()
        detail = JobDetail(
            id=job_id,
            state=JobState.PENDING,
            started_at=now,
            stopped_at=None,
            cost_usd=0.0,
            budget_cap_usd=payload.budget_cap_usd,
            image_uri=payload.image_uri,
            cpu=payload.cpu,
            memory=payload.memory,
            gpu=payload.gpu,
            termination_reason=None,
            telemetry=[],
        )
        self._items[job_id] = detail
        return detail

    def stop(self, job_id: str, reason: str) -> JobDetail:
        job = self.get(job_id)
        job.state = JobState.STOPPED
        job.stopped_at = datetime.utcnow()
        job.termination_reason = reason
        return job

    def append_telemetry(self, job_id: str, sample: TelemetryPoint) -> None:
        job = self.get(job_id)
        job.telemetry.append(sample)
        if len(job.telemetry) > 360:
            job.telemetry = job.telemetry[-360:]


_store = _JobStore()


def _estimate_cost(payload: JobCreate, elapsed: timedelta) -> float:
    hourly_cost = payload.cpu / 1024 * 0.046 + payload.memory / 1024 * 0.005
    return round(hourly_cost * (elapsed.total_seconds() / 3600), 4)


@router.get("", response_model=list[JobListItem])
async def list_jobs() -> list[JobListItem]:
    """Return all jobs visible to the active organisation."""

    return _store.list()


@router.post("", response_model=JobDetail, status_code=status.HTTP_202_ACCEPTED)
async def create_job(payload: JobCreate) -> JobDetail:
    """Validate the request and register a pending job."""

    settings = get_settings()
    if payload.max_runtime_minutes > settings.max_runtime_minutes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="max_runtime_minutes exceeds the configured service limit",
        )
    if payload.budget_cap_usd < settings.minimum_budget_cap_usd:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="budget_cap_usd below service minimum",
        )

    job = _store.create(payload)

    elapsed = timedelta(minutes=min(payload.max_runtime_minutes, 60))
    job.cost_usd = _estimate_cost(payload, elapsed)

    if job.cost_usd >= payload.budget_cap_usd:
        job = _store.stop(job.id, "budget_cap_reached")

    return job


@router.post("/{job_id}/stop", response_model=JobDetail)
async def stop_job(job_id: str) -> JobDetail:
    """Stop a running job manually."""

    return _store.stop(job_id, "user_requested")


@router.get("/{job_id}", response_model=JobDetail)
async def get_job(job_id: str) -> JobDetail:
    """Return job details."""

    return _store.get(job_id)
