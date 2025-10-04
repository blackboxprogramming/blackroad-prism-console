"""Autopal FastAPI entrypoint."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict

from fastapi import Depends, FastAPI, HTTPException, Request, status

from .config import AppConfig
from .dependencies import enforce_security, get_config, get_dual_control_registry, load_initial_config
from .dual_control import DualControlError, DualControlRegistry
from .rate_limiter import InMemoryRateLimiter
from .schemas import ApprovalConfirm, ApprovalRequest, ApprovalResponse, MaterializeResponse

APP_TITLE = "Autopal Console"
APP_VERSION = "0.1.0"

app = FastAPI(title=APP_TITLE, version=APP_VERSION)


def _default_config_path() -> Path:
    """Resolve the configuration file path, honoring the ``AUTOPAL_CONFIG`` env var."""

    override = os.getenv("AUTOPAL_CONFIG")
    if override:
        return Path(override).expanduser()
    return Path(__file__).resolve().parents[1] / "autopal.config.json"


def _normalize_context(raw: str) -> str:
    """Ensure the approval context is a normalized endpoint path."""

    context = raw.strip()
    if not context.startswith("/"):
        context = f"/{context}"
    return context


@app.on_event("startup")
async def startup_event() -> None:
    config_path = _default_config_path()
    app.state.config_path = config_path
    config = load_initial_config(config_path)
    app.state.config = config
    app.state.rate_limiter = InMemoryRateLimiter()
    app.state.dual_control = DualControlRegistry(config.dual_control_timeout_seconds)


@app.get("/health/live")
async def live() -> Dict[str, str]:
    """Liveness probe."""

    return {"status": "live"}


@app.get("/health/ready")
async def ready(config: AppConfig = Depends(get_config)) -> Dict[str, str]:
    """Readiness probe that surfaces the global switch state."""

    return {"status": "ready", "global_enabled": "true" if config.global_enabled else "false"}


@app.get("/config")
async def current_config(config: AppConfig = Depends(get_config)) -> Dict[str, object]:
    """Expose the current configuration (sans secrets)."""

    return config.model_dump()


@app.post("/config/reload", status_code=status.HTTP_202_ACCEPTED)
async def reload_config(request: Request) -> Dict[str, str]:
    """Reload configuration from disk."""

    config_path: Path = request.app.state.config_path
    config = load_initial_config(config_path)
    request.app.state.config = config
    request.app.state.dual_control = DualControlRegistry(config.dual_control_timeout_seconds)
    return {"status": "reloaded"}


@app.post(
    "/secrets/approvals/request",
    status_code=status.HTTP_201_CREATED,
    response_model=ApprovalResponse,
    dependencies=[Depends(enforce_security("/secrets/approvals/request"))],
)
async def create_approval(
    payload: ApprovalRequest,
    registry: DualControlRegistry = Depends(get_dual_control_registry),
) -> ApprovalResponse:
    """Stage a dual-control approval."""

    context = _normalize_context(payload.context)
    record = await registry.request(
        context=context,
        requested_by=payload.requested_by,
        metadata=payload.metadata,
    )
    return ApprovalResponse(
        approval_id=record.approval_id,
        context=record.context,
        requested_by=record.requested_by,
        approved_by=record.approved_by,
        consumed_at=record.consumed_at,
    )


@app.post(
    "/secrets/approvals/{approval_id}/approve",
    response_model=ApprovalResponse,
    dependencies=[Depends(enforce_security("/secrets/approvals/approve"))],
)
async def approve_request(
    approval_id: str,
    payload: ApprovalConfirm,
    registry: DualControlRegistry = Depends(get_dual_control_registry),
) -> ApprovalResponse:
    """Confirm an existing dual-control approval."""

    try:
        record = await registry.approve(approval_id, approved_by=payload.approved_by)
    except DualControlError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ApprovalResponse(
        approval_id=record.approval_id,
        context=record.context,
        requested_by=record.requested_by,
        approved_by=record.approved_by,
        consumed_at=record.consumed_at,
    )


@app.get(
    "/secrets/approvals/{approval_id}",
    response_model=ApprovalResponse,
    dependencies=[Depends(enforce_security("/secrets/approvals/status"))],
)
async def get_approval(
    approval_id: str,
    registry: DualControlRegistry = Depends(get_dual_control_registry),
) -> ApprovalResponse:
    """Inspect the current state of an approval."""

    try:
        record = await registry.get(approval_id)
    except DualControlError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return ApprovalResponse(
        approval_id=record.approval_id,
        context=record.context,
        requested_by=record.requested_by,
        approved_by=record.approved_by,
        consumed_at=record.consumed_at,
    )


@app.post(
    "/secrets/materialize",
    response_model=MaterializeResponse,
    dependencies=[Depends(enforce_security("/secrets/materialize"))],
)
async def materialize_secret(request: Request) -> MaterializeResponse:
    """Materialize a secret once all controls pass."""

    approval_record = getattr(request.state, "dual_control_record", None)
    if approval_record is None:
        raise HTTPException(status_code=500, detail="Dual-control record missing")

    secret_handle = f"secret::{approval_record.approval_id}"
    return MaterializeResponse(status="ok", approval_id=approval_record.approval_id, secret_handle=secret_handle)
