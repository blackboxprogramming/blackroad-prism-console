"""Quantum Lab API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lucidia.quantum import is_enabled

router = APIRouter(prefix="/api/quantum")


def _require_enabled() -> None:
    if not is_enabled():
        raise HTTPException(status_code=503, detail="Quantum disabled")


class TrainRequest(BaseModel):
    data: list[list[float]]
    labels: list[int]


@router.post("/qnn/train")
def train_qnn(req: TrainRequest) -> dict[str, str]:
    _require_enabled()
    # In a real implementation this would enqueue a training job.
    return {"status": "queued"}


class PredictRequest(BaseModel):
    data: list[list[float]]


@router.post("/qnn/predict")
def predict_qnn(req: PredictRequest) -> dict[str, list[int]]:
    _require_enabled()
    # Placeholder deterministic prediction
    preds = [0 for _ in req.data]
    return {"status": "ok", "prediction": preds}


class KernelRequest(BaseModel):
    data: list[list[float]]
    labels: list[int]


@router.post("/kernel/qsvc")
def kernel_qsvc(req: KernelRequest) -> dict[str, list[int]]:
    _require_enabled()
    # Stubbed kernel-based classifier
    return {"status": "ok", "prediction": req.labels}
