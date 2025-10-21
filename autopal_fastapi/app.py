"""FastAPI application that models the Autopal control flows."""

from __future__ import annotations

import json
import logging
import time
import uuid
from collections import deque
from typing import Any, Deque, Dict, Iterable

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from .audit import AuditLogger, append_trace_headers, current_trace_ids
from .observability import configure_observability
from pydantic import BaseModel, Field, PositiveInt


logger = logging.getLogger("autopal.audit")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False


def audit_log(request: Request, event: str, **fields: Any) -> None:
    """Emit a structured audit log entry for operational dashboards."""

    record: dict[str, Any] = {
        "event": event,
        "endpoint": request.url.path,
        "method": request.method,
    }

    trace_id = request.headers.get("x-trace-id")
    if trace_id:
        record["trace_id"] = trace_id

    subject = request.headers.get("x-actor")
    if subject:
        record.setdefault("subject", subject)

    for key, value in fields.items():
        if value is not None:
            record[key] = value

    logger.info(json.dumps(record))


class Identity(BaseModel):
    """Represents the authenticated caller."""

    subject: str
    email: str


class RateLimitConfig(BaseModel):
    """Configuration payload for the in-memory rate limiter."""

    limit: PositiveInt = Field(..., description="Maximum number of requests allowed within the window.")
    window_seconds: PositiveInt = Field(..., description="Window size in seconds for rate counting.")


class RateLimiter:
    """Simple in-memory rate limiter keyed by caller identity."""

    def __init__(self, limit: int = 10, window_seconds: int = 60) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: Dict[str, Deque[float]] = {}

    def configure(self, *, limit: int, window_seconds: int) -> None:
        """Update limiter configuration and clear historical counts."""

        self.limit = limit
        self.window_seconds = window_seconds
        self._hits.clear()

    def check(self, identity: str) -> None:
        """Raise when the caller exceeds the configured rate."""

        now = time.monotonic()
        queue = self._hits.setdefault(identity, deque())
        boundary = now - self.window_seconds

        while queue and queue[0] <= boundary:
            queue.popleft()

        if len(queue) >= self.limit:
            raise HTTPException(status_code=429, detail="rate_limit_exceeded")

        queue.append(now)


class Override(BaseModel):
    """Represents a dual-control override request."""

    override_id: str
    reason: str | None = None
    approvals: list[str] = Field(default_factory=list)
    granted: bool = False


def _allowlisted(path: str, allowlist: Iterable[str]) -> bool:
    return any(path.startswith(prefix) for prefix in allowlist)


async def get_identity(_: Request) -> Identity:
    """Default identity dependency that mimics a locked-down OIDC handler."""

    raise HTTPException(status_code=401, detail="unauthenticated")


def require_step_up(request: Request) -> None:
    """Ensure the caller satisfied a hypothetical step-up challenge."""

    if request.headers.get("x-step-up") != "verified":
        audit_log(request, "step_up.prompt", status_code=401)
        raise HTTPException(status_code=401, detail="step_up_required")


def create_app() -> FastAPI:
    """Instantiate the FastAPI application with all routes and state."""

    app = FastAPI(title="Autopal Controls API", version="1.0.0")

    configure_observability(app, service_version=app.version)

    # Global state shared between requests for the lifetime of the application instance.
    app.state.maintenance_mode = False
    app.state.maintenance_allowlist = ("/health", "/maintenance")
    app.state.rate_limiter = RateLimiter()
    app.state.overrides: Dict[str, Override] = {}
    app.state.audit_logger = AuditLogger.from_environment()

    @app.middleware("http")
    async def observability_middleware(request: Request, call_next):  # type: ignore[override]
        start = time.perf_counter()
        audit_logger: AuditLogger | None = getattr(request.app.state, "audit_logger", None)
        try:
            response = await call_next(request)
        except HTTPException as exc:
            if audit_logger:
                audit_logger.log(
                    "http.request",
                    path=request.url.path,
                    method=request.method,
                    status=exc.status_code,
                    duration_ms=(time.perf_counter() - start) * 1000,
                )
            raise
        except Exception:
            if audit_logger:
                audit_logger.log(
                    "http.request",
                    path=request.url.path,
                    method=request.method,
                    status=500,
                    duration_ms=(time.perf_counter() - start) * 1000,
                )
            raise
        else:
            duration_ms = (time.perf_counter() - start) * 1000
            append_trace_headers(response, current_trace_ids())
            if audit_logger:
                audit_logger.log(
                    "http.request",
                    path=request.url.path,
                    method=request.method,
                    status=response.status_code,
                    duration_ms=duration_ms,
                )
            return response

    @app.middleware("http")
    async def maintenance_middleware(request: Request, call_next):  # type: ignore[override]
        if request.app.state.maintenance_mode and not _allowlisted(
            request.url.path, request.app.state.maintenance_allowlist
        ):
            audit_log(request, "maintenance.block", status_code=503)
            return JSONResponse(status_code=503, content={"detail": "maintenance_mode"})

        return await call_next(request)

    @app.get("/health/live")
    async def live() -> dict[str, str]:
        return {"status": "live"}

    @app.get("/health/ready")
    async def ready() -> dict[str, str]:
        return {"status": "ready"}

    @app.post("/maintenance/activate")
    async def activate_maintenance() -> dict[str, bool]:
        app.state.maintenance_mode = True
        audit_logger: AuditLogger | None = getattr(app.state, "audit_logger", None)
        if audit_logger:
            audit_logger.log("maintenance.toggle", state="activated")
        return {"maintenance_mode": True}

    @app.post("/maintenance/deactivate")
    async def deactivate_maintenance() -> dict[str, bool]:
        app.state.maintenance_mode = False
        audit_logger: AuditLogger | None = getattr(app.state, "audit_logger", None)
        if audit_logger:
            audit_logger.log("maintenance.toggle", state="deactivated")
        return {"maintenance_mode": False}

    @app.post("/config/rate-limit")
    async def configure_rate_limit(payload: RateLimitConfig) -> RateLimitConfig:
        app.state.rate_limiter.configure(limit=payload.limit, window_seconds=payload.window_seconds)
        audit_logger: AuditLogger | None = getattr(app.state, "audit_logger", None)
        if audit_logger:
            audit_logger.log(
                "rate_limit.updated",
                limit=payload.limit,
                window_seconds=payload.window_seconds,
            )
        return payload

    @app.get("/limited/ping")
    async def limited_ping(request: Request, identity: Identity = Depends(get_identity)) -> dict[str, str]:
        limiter: RateLimiter = app.state.rate_limiter
        try:
            limiter.check(identity.subject)
        except HTTPException as exc:
            if exc.status_code == 429:
                audit_log(
                    request,
                    "rate_limit.hit",
                    status_code=exc.status_code,
                    subject=identity.subject,
                    limit=limiter.limit,
                    window_seconds=limiter.window_seconds,
                )
            raise
        return {"message": "pong", "subject": identity.subject}

    @app.get("/secrets/materialize")
    async def materialize_secret(
        request: Request, identity: Identity = Depends(get_identity)
    ) -> dict[str, str]:
        require_step_up(request)
        audit_log(request, "step_up.granted", status_code=200, subject=identity.subject)
        audit_logger: AuditLogger | None = getattr(app.state, "audit_logger", None)
        if audit_logger:
            audit_logger.log("secrets.materialized", subject=identity.subject)
        return {"materialized": "secret", "granted_to": identity.subject}

    @app.post("/controls/overrides", status_code=201)
    async def create_override(reason: str | None = None) -> Override:
        override_id = str(uuid.uuid4())
        override = Override(override_id=override_id, reason=reason)
        app.state.overrides[override_id] = override
        audit_logger: AuditLogger | None = getattr(app.state, "audit_logger", None)
        if audit_logger:
            audit_logger.log("controls.override.created", override_id=override_id)
        return override

    @app.post("/controls/overrides/{override_id}/approve")
    async def approve_override(
        override_id: str, identity: Identity = Depends(get_identity)
    ) -> Override:
        overrides: Dict[str, Override] = app.state.overrides
        override = overrides.get(override_id)
        if override is None:
            raise HTTPException(status_code=404, detail="override_not_found")

        if identity.subject in override.approvals:
            raise HTTPException(status_code=400, detail="duplicate_approval")

        override.approvals.append(identity.subject)
        if len(set(override.approvals)) >= 2:
            override.granted = True

        overrides[override_id] = override
        audit_logger: AuditLogger | None = getattr(app.state, "audit_logger", None)
        if audit_logger:
            audit_logger.log(
                "controls.override.approved",
                override_id=override_id,
                approvals=list(override.approvals),
                granted=override.granted,
            )
        return override

    return app



app = create_app()
