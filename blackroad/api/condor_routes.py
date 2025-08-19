"""Minimal Condor API routes for BlackRoad."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lucidia.engines import condor_engine

router = APIRouter(prefix="/api/condor")


class RunRequest(BaseModel):
    type: str
    model_source: str
    class_name: str
    args: dict | None = None
    options: dict | None = None


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

