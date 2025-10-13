"""Autopal FastAPI entrypoint."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict

from fastapi import Depends, FastAPI, HTTPException, Request, status
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from .config import AppConfig
from .dependencies import enforce_security, get_config, get_dual_control_registry, get_environment_registry, load_initial_config
from .dual_control import DualControlError, DualControlRegistry
from .environment_control import EnvironmentControlError, EnvironmentRegistry
from .rate_limiter import InMemoryRateLimiter
from .schemas import ApprovalConfirm, ApprovalRequest, ApprovalResponse, EnvironmentRequest, EnvironmentResponse, MaterializeResponse
from .metrics import snapshot as metrics_snapshot
from .otel import init_tracing

APP_TITLE = "Autopal Console"
APP_VERSION = "0.1.0"

init_tracing("autopal-fastapi")
app = FastAPI(title=APP_TITLE, version=APP_VERSION)
FastAPIInstrumentor().instrument_app(app)


@app.middleware("http")
async def add_trace_header(request: Request, call_next):
    response = await call_next(request)
    span = trace.get_current_span()
    context = span.get_span_context() if span is not None else None
    if context and context.trace_id:
        response.headers["X-Trace-Id"] = format(context.trace_id, "032x")
    return response


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
    app.state.environment_registry = EnvironmentRegistry(config.dual_control_timeout_seconds)


@app.get("/health/live")
async def live() -> Dict[str, str]:
    """Liveness probe."""

    return {"status": "live"}


@app.get("/health/ready")
async def ready(config: AppConfig = Depends(get_config)) -> Dict[str, str]:
    """Readiness probe that surfaces the global switch state."""

    return {"status": "ready", "global_enabled": "true" if config.global_enabled else "false"}


@app.get("/metrics")
async def metrics() -> Dict[str, Dict[str, int]]:
    """Expose in-process counters for lightweight telemetry."""

    return {"counters": metrics_snapshot()}


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
    request.app.state.environment_registry = EnvironmentRegistry(config.dual_control_timeout_seconds)
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


@app.post(
    "/environments/request",
    status_code=status.HTTP_201_CREATED,
    response_model=EnvironmentResponse,
    dependencies=[Depends(enforce_security("/environments/request"))],
)
async def request_environment_access(
    payload: EnvironmentRequest,
    registry: EnvironmentRegistry = Depends(get_environment_registry),
) -> EnvironmentResponse:
    """Request access to a remote environment."""

    record = await registry.request(
        environment_name=payload.environment_name,
        requested_by=payload.requested_by,
        purpose=payload.purpose,
        duration_minutes=payload.duration_minutes,
        metadata=payload.metadata,
    )
    return EnvironmentResponse(
        request_id=record.request_id,
        environment_name=record.environment_name,
        requested_by=record.requested_by,
        purpose=record.purpose,
        duration_minutes=record.duration_minutes,
        approved_by=record.approved_by,
        granted_at=record.granted_at,
        expires_at=record.expires_at,
    )


@app.post(
    "/environments/{request_id}/approve",
    response_model=EnvironmentResponse,
    dependencies=[Depends(enforce_security("/environments/approve"))],
)
async def approve_environment_request(
    request_id: str,
    payload: ApprovalConfirm,
    registry: EnvironmentRegistry = Depends(get_environment_registry),
) -> EnvironmentResponse:
    """Approve an environment access request."""

    try:
        record = await registry.approve(request_id, approved_by=payload.approved_by)
    except EnvironmentControlError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return EnvironmentResponse(
        request_id=record.request_id,
        environment_name=record.environment_name,
        requested_by=record.requested_by,
        purpose=record.purpose,
        duration_minutes=record.duration_minutes,
        approved_by=record.approved_by,
        granted_at=record.granted_at,
        expires_at=record.expires_at,
    )


@app.get(
    "/environments/{request_id}",
    response_model=EnvironmentResponse,
    dependencies=[Depends(enforce_security("/environments/status"))],
)
async def get_environment_request(
    request_id: str,
    registry: EnvironmentRegistry = Depends(get_environment_registry),
) -> EnvironmentResponse:
    """Get the status of an environment access request."""

    try:
        record = await registry.get(request_id)
    except EnvironmentControlError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return EnvironmentResponse(
        request_id=record.request_id,
        environment_name=record.environment_name,
        requested_by=record.requested_by,
        purpose=record.purpose,
        duration_minutes=record.duration_minutes,
        approved_by=record.approved_by,
        granted_at=record.granted_at,
        expires_at=record.expires_at,
    )
