"""FastAPI routes exposing the Condor engine.

These routes are intentionally simple and focus on input validation.  The
heavy lifting is delegated to :mod:`lucidia.engines.condor_engine`.
"""
"""Minimal Condor API routes for BlackRoad."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lucidia.engines import condor_engine

router = APIRouter()


class RunBody(BaseModel):
router = APIRouter(prefix="/api/condor")


class RunRequest(BaseModel):
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
@router.get("/health")
def health() -> dict:
    """Simple liveness probe."""

    return {"ok": True}


@router.post("/run")
def run(req: RunRequest) -> dict:
    """Execute a Condor model based on the ``type`` field."""

    try:
        if req.type == "solve":
            model_cls = condor_engine.load_model_from_source(req.model_source, req.class_name)
            result = condor_engine.solve_algebraic(model_cls, **(req.args or {}))
        elif req.type == "simulate":
            model_cls = condor_engine.load_model_from_source(req.model_source, req.class_name)
            args = req.args or {}
            result = condor_engine.simulate_ode(
                model_cls,
                args.get("t_final", 1.0),
                args.get("initial", {}),
                args.get("params", {}),
            )
        elif req.type == "optimize":
            model_cls = condor_engine.load_model_from_source(req.model_source, req.class_name)
            args = req.args or {}
            result = condor_engine.optimize(
                model_cls,  # type: ignore[arg-type]
                args.get("initial_guess", {}),
                args.get("bounds", {}),
                req.options or {},
            )
        else:
            raise HTTPException(status_code=400, detail="unknown type")
    except Exception as exc:  # pragma: no cover - error path
        raise HTTPException(status_code=500, detail=str(exc))

    return {"status": "ok", "results": result}

