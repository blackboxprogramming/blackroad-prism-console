"""AI Console FastAPI service with authentication, observability, and controls."""

from __future__ import annotations

import os
import statistics
import time
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt
import psutil
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from prometheus_client import (
    CollectorRegistry,
    Counter,
    Gauge,
    Histogram,
    CONTENT_TYPE_LATEST,
    generate_latest,
)

from console_auth import AuthManager, Principal, SAFE_METHODS, build_session_store

# Capture the time when the application starts. Used to calculate uptime.
startup_time = time.time()

# Prometheus metrics registry and instruments
registry = CollectorRegistry()
uptime_gauge = Gauge(
    "ai_console_uptime_seconds",
    "Uptime of the AI console in seconds",
    registry=registry,
)
models_loaded_gauge = Gauge(
    "ai_console_models_loaded",
    "Number of machine-learning models currently loaded",
    registry=registry,
)
request_latency_histogram = Histogram(
    "http_request_duration_seconds",
    "Request latency distribution",
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5),
    registry=registry,
)
request_counter = Counter(
    "ai_console_http_requests_total",
    "HTTP requests processed by the AI console",
    labelnames=("method", "path", "status"),
    registry=registry,
)

default_rate_limit = {"limit": 120, "window_seconds": 60}
PROTECTED_PREFIXES = ("/metrics", "/maintenance", "/config", "/controls")


class RateLimitUpdate(BaseModel):
    limit: int = Field(..., gt=0)
    window_seconds: int = Field(..., gt=0)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., alias="refreshToken")

    class Config:
        allow_population_by_field_name = True


class ControlAction(BaseModel):
    reason: str | None = Field(default=None, description="Optional operator reason")


def _threshold_state(value: float) -> str:
    if value < 70:
        return "ok"
    if value < 90:
        return "degraded"
    return "down"


def _latency_state(value_ms: float) -> str:
    if value_ms < 250:
        return "ok"
    if value_ms < 750:
        return "degraded"
    return "down"


def create_app() -> FastAPI:
    secret = os.getenv("AI_CONSOLE_JWT_SECRET", os.getenv("JWT_SECRET", "dev-secret"))
    algorithm = os.getenv("AI_CONSOLE_JWT_ALGORITHM", "HS256")
    audience = os.getenv("AI_CONSOLE_JWT_AUDIENCE")
    issuer = os.getenv("AI_CONSOLE_JWT_ISSUER")
    redis_url = os.getenv("AI_CONSOLE_REDIS_URL") or os.getenv("REDIS_URL") or "memory://"
    access_ttl_minutes = int(os.getenv("AI_CONSOLE_ACCESS_TTL_MINUTES", "60"))
    refresh_ttl_minutes = int(os.getenv("AI_CONSOLE_REFRESH_TTL_MINUTES", "1440"))

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        session_store = await build_session_store(redis_url)
        app.state.session_store = session_store
        app.state.auth_manager = AuthManager(
            secret=secret,
            algorithm=algorithm,
            audience=audience,
            issuer=issuer,
            session_store=session_store,
            leeway_seconds=int(os.getenv("AI_CONSOLE_JWT_LEEWAY", "30")),
        )
        app.state.access_ttl_minutes = access_ttl_minutes
        app.state.refresh_ttl_minutes = refresh_ttl_minutes
        try:
            yield
        finally:
            await session_store.close()

    app = FastAPI(title="AI Console", lifespan=lifespan)

    # Global state for quick system introspection
    app.state.models_loaded = getattr(app.state, "models_loaded", 0)
    app.state.maintenance_mode = False
    app.state.rate_limit_config = RateLimitUpdate(**default_rate_limit)
    app.state.latency_window = deque(maxlen=24)

    def issue_tokens(subject: str, role: str) -> tuple[Dict[str, str], datetime]:
        now = datetime.now(tz=timezone.utc)
        access_exp = now + timedelta(minutes=access_ttl_minutes)
        refresh_exp = now + timedelta(minutes=refresh_ttl_minutes)
        base_claims: Dict[str, Any] = {
            "sub": subject,
            "role": role,
            "iat": int(now.timestamp()),
        }
        if issuer:
            base_claims["iss"] = issuer
        if audience:
            base_claims["aud"] = audience

        access_payload = {
            **base_claims,
            "exp": int(access_exp.timestamp()),
            "refresh_exp": int(refresh_exp.timestamp()),
            "token_use": "access",
        }
        refresh_payload = {
            **base_claims,
            "exp": int(refresh_exp.timestamp()),
            "refresh_exp": int(refresh_exp.timestamp()),
            "token_use": "refresh",
        }
        access_token = jwt.encode(access_payload, secret, algorithm=algorithm)
        refresh_token = jwt.encode(refresh_payload, secret, algorithm=algorithm)
        return {"access_token": access_token, "refresh_token": refresh_token}, refresh_exp

    def require_role(min_role: str, *, allow_member_write: bool = False):
        async def dependency(request: Request) -> Principal:
            principal: Principal | None = getattr(request.state, "principal", None)
            if principal is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthenticated")
            manager: AuthManager = request.app.state.auth_manager
            if not manager.has_role(principal.role, min_role):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="insufficient_role")
            if request.method not in SAFE_METHODS:
                if principal.role == "guest":
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="read_only_role")
                if principal.role == "member" and not allow_member_write:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="member_write_restricted")
            return principal

        return dependency

    @app.middleware("http")
    async def telemetry_middleware(request: Request, call_next):  # type: ignore[override]
        start = time.perf_counter()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except HTTPException as exc:
            status_code = exc.status_code
            raise
        finally:
            duration = time.perf_counter() - start
            request_latency_histogram.observe(duration)
            path = request.url.path.split("?")[0]
            request_counter.labels(request.method, path, str(status_code)).inc()
            app.state.latency_window.append(duration * 1000.0)

    @app.middleware("http")
    async def auth_middleware(request: Request, call_next):  # type: ignore[override]
        path = request.url.path
        if not path.startswith(PROTECTED_PREFIXES):
            return await call_next(request)

        header = request.headers.get("authorization")
        if not header or not header.lower().startswith("bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "missing_authorization"},
            )

        token = header.split(" ", 1)[1].strip()
        manager: AuthManager = request.app.state.auth_manager
        principal = await manager.authenticate(token)
        request.state.principal = principal
        return await call_next(request)

    @app.get("/health/live")
    async def live() -> Dict[str, str]:
        return {"status": "live"}

    @app.get("/health/ready")
    async def ready() -> Dict[str, str]:
        return {"status": "ready"}

    @app.get("/health")
    async def health() -> Dict[str, Any]:
        uptime_seconds = time.time() - startup_time
        models_loaded = getattr(app.state, "models_loaded", 0)
        return {
            "status": "ok",
            "uptime_seconds": uptime_seconds,
            "version": app.version,
            "models_loaded": models_loaded,
        }

    @app.get("/metrics", dependencies=[Depends(require_role("guest"))])
    async def metrics() -> Response:
        uptime_gauge.set(time.time() - startup_time)
        models_loaded_gauge.set(getattr(app.state, "models_loaded", 0))
        payload = generate_latest(registry)
        return Response(payload, media_type=CONTENT_TYPE_LATEST)

    @app.get("/system/status", dependencies=[Depends(require_role("guest"))])
    async def system_status() -> Dict[str, Any]:
        cpu_percent = float(psutil.cpu_percent(interval=None))
        memory_percent = float(psutil.virtual_memory().percent)
        latencies = list(app.state.latency_window)
        latency_ms = statistics.mean(latencies) if latencies else 0.0
        uptime_seconds = time.time() - startup_time
        return {
            "cpu": {"value": cpu_percent, "state": _threshold_state(cpu_percent)},
            "memory": {"value": memory_percent, "state": _threshold_state(memory_percent)},
            "latency": {"value": latency_ms, "state": _latency_state(latency_ms)},
            "uptime_seconds": uptime_seconds,
            "generated_at": datetime.now(tz=timezone.utc).isoformat(),
        }

    @app.get("/maintenance/status", dependencies=[Depends(require_role("member"))])
    async def maintenance_status() -> Dict[str, bool]:
        return {"active": bool(app.state.maintenance_mode)}

    @app.post("/maintenance/activate", dependencies=[Depends(require_role("admin"))])
    async def maintenance_activate(action: ControlAction | None = None) -> Dict[str, Any]:
        app.state.maintenance_mode = True
        return {"active": True, "reason": action.reason if action else None}

    @app.post("/maintenance/deactivate", dependencies=[Depends(require_role("admin"))])
    async def maintenance_deactivate(action: ControlAction | None = None) -> Dict[str, Any]:
        app.state.maintenance_mode = False
        return {"active": False, "reason": action.reason if action else None}

    @app.get("/config/rate-limit", dependencies=[Depends(require_role("member"))])
    async def rate_limit_config() -> Dict[str, int]:
        cfg: RateLimitUpdate = app.state.rate_limit_config
        return cfg.dict()

    @app.put(
        "/config/rate-limit",
        dependencies=[Depends(require_role("member", allow_member_write=True))],
    )
    async def update_rate_limit(body: RateLimitUpdate) -> Dict[str, Any]:
        app.state.rate_limit_config = body
        return {"ok": True, "config": body.dict()}

    @app.post("/controls/restart", dependencies=[Depends(require_role("admin"))])
    async def control_restart(action: ControlAction | None = None) -> Dict[str, Any]:
        return {
            "accepted": True,
            "operation": "restart",
            "requested_at": datetime.now(tz=timezone.utc).isoformat(),
            "reason": action.reason if action else None,
        }

    @app.post(
        "/controls/cache-flush",
        dependencies=[Depends(require_role("member", allow_member_write=True))],
    )
    async def control_cache_flush(action: ControlAction | None = None) -> Dict[str, Any]:
        return {
            "accepted": True,
            "operation": "cache_flush",
            "requested_at": datetime.now(tz=timezone.utc).isoformat(),
            "reason": action.reason if action else None,
        }

    @app.post("/auth/refresh")
    async def refresh_tokens(body: RefreshRequest) -> Dict[str, Any]:
        manager: AuthManager = app.state.auth_manager
        principal = await manager.authenticate_refresh(body.refresh_token)
        tokens, refresh_exp = issue_tokens(principal.subject, principal.role)
        await manager.record_tokens(tokens, principal.role, principal.subject, refresh_exp)
        return {
            "accessToken": tokens["access_token"],
            "refreshToken": tokens["refresh_token"],
            "role": principal.role,
            "expiresAt": datetime.fromtimestamp(
                jwt.decode(tokens["access_token"], options={"verify_signature": False})["exp"],
                tz=timezone.utc,
            ).isoformat(),
        }

    return app


app = create_app()
