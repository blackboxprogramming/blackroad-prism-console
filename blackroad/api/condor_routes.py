"""FastAPI routes exposing the Condor engine.

These routes are intentionally simple and focus on input validation.  The
heavy lifting is delegated to :mod:`lucidia.engines.condor_engine`.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lucidia.engines import condor_engine

router = APIRouter()


class RunBody(BaseModel):
    type: str
    model_source: str
    class_name: str
    args: dict | None = None
    options: dict | None = None


class OptimizeBody(BaseModel):
    problem_source: str
    class_name: str
    initial: dict
    bounds: dict | None = None
    options: dict | None = None


@router.post("/api/condor/run")
def run_model(body: RunBody) -> dict:
    try:
        condor_engine.validate_model_source(body.model_source)
    except ValueError as exc:  # pragma: no cover - basic validation
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "ok", "results": {}}


@router.post("/api/condor/optimize")
def optimize(body: OptimizeBody) -> dict:
    try:
        condor_engine.validate_model_source(body.problem_source)
    except ValueError as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "ok", "results": {}}


@router.get("/api/condor/health")
def health() -> dict:
    return {"status": "ok"}
