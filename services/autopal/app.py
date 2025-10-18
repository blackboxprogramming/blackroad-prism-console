"""Autopal emergency FastAPI application."""

from __future__ import annotations

from fastapi import Depends, FastAPI, Response
from fastapi.responses import JSONResponse

from .audit import AuditLogger
from .breakglass import BreakGlassContext, BreakGlassGate
from .config import config_loader
from .guard import AccessGuard
from .schemas import (
    ApprovalRequest,
    FossilOverrideRequest,
    MaterializeRequest,
    OperationResponse,
)

from services.observability import DependencyRecorder, DependencyStatus

app = FastAPI(title="Autopal Emergency Console", version="0.1.0", docs_url=None)

audit_logger = AuditLogger()
break_glass_gate = BreakGlassGate(audit_logger)
access_guard = AccessGuard(config_loader, break_glass_gate, audit_logger)
_dependency_recorder = DependencyRecorder("autopal-console")


def _config_dependency() -> dict[str, DependencyStatus]:
    try:
        cfg = config_loader.get()
    except Exception as exc:  # noqa: BLE001
        return {"config": DependencyStatus.error(str(exc))}

    allowlist = len(getattr(cfg.break_glass, "allowlist_endpoints", []) or [])
    detail = f"allowlist_entries={allowlist}"
    return {"config": DependencyStatus.ok(detail)}


@app.middleware("http")
async def enforce_break_glass_allowlist(request, call_next):
    """Reject break-glass headers on endpoints outside of the allowlist."""

    token = request.headers.get(BreakGlassGate.HEADER)
    if not token:
        return await call_next(request)
    config = config_loader.get()
    method = request.method.upper()
    path = request.url.path
    if not break_glass_gate.is_allowlisted(method, path, config.break_glass):
        return JSONResponse(status_code=403, content={"detail": "Break-glass not permitted for this endpoint"})
    return await call_next(request)


@app.get("/healthz")
async def healthcheck() -> dict[str, object]:
    statuses = _config_dependency()
    return _dependency_recorder.snapshot(statuses)


@app.get("/metrics")
async def metrics() -> Response:
    statuses = _config_dependency()
    _dependency_recorder.snapshot(statuses)
    return Response(
        content=_dependency_recorder.render_prometheus(),
        media_type=_dependency_recorder.prometheus_content_type,
    )


@app.post("/secrets/materialize", response_model=OperationResponse)
async def materialize_secret(
    payload: MaterializeRequest,
    context: BreakGlassContext | None = Depends(access_guard),
) -> OperationResponse:
    return OperationResponse.from_context("materialized", payload.reason, context)


@app.post("/fossil/override", response_model=OperationResponse)
async def override_fossil(
    payload: FossilOverrideRequest,
    context: BreakGlassContext | None = Depends(access_guard),
) -> OperationResponse:
    detail = f"override requested by {payload.requested_by}"
    return OperationResponse.from_context("override_submitted", detail, context)


@app.post("/approvals/{rid}/approve", response_model=OperationResponse)
async def approve_request(
    rid: str,
    payload: ApprovalRequest,
    context: BreakGlassContext | None = Depends(access_guard),
) -> OperationResponse:
    detail = f"approval for {rid} by {payload.actor}"
    return OperationResponse.from_context("approved", detail, context)


__all__ = ["app"]
