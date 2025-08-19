"""FastAPI agent exposing c-LFM operations."""

from __future__ import annotations

from fastapi import APIRouter

from ..clfm import train as train_impl, sample as sample_impl, evaluate as eval_impl

router = APIRouter(prefix="/api/clfm", tags=["clfm"])


@router.post("/train")
def train_endpoint(cfg: dict | None = None) -> dict:
    return train_impl(cfg)


@router.post("/sample")
def sample_endpoint(cfg: dict | None = None, n: int = 1) -> dict:
    samples = sample_impl(cfg, n)
    return {"n": int(samples.size(0))}


@router.post("/eval")
def eval_endpoint(cfg: dict | None = None) -> dict:
    return eval_impl(cfg)
