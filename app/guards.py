from __future__ import annotations

import math
from typing import Any, Dict, Optional

from fastapi import Header, HTTPException, Request

from .config import ConfigHolder
from .oidc import verify_oidc
from .ratelimit import _bucket


def maintenance_guard(cfg: ConfigHolder):
    def dep() -> None:
        maintenance_cfg = getattr(cfg.current, "maintenance", None)
        if isinstance(maintenance_cfg, dict) and maintenance_cfg.get("enabled"):
            message = maintenance_cfg.get("message", "Service under maintenance")
            raise HTTPException(
                status_code=503,
                detail={"code": "maintenance", "message": message},
            )

    return dep


def stepup_guard(cfg: ConfigHolder):
    def dep(x_step_up_token: str = Header(default="")) -> None:
        step_cfg = getattr(cfg.current, "stepup", None) or getattr(cfg.current, "step_up", None)
        if not isinstance(step_cfg, dict):
            return
        if not step_cfg.get("required"):
            return
        expected = step_cfg.get("token")
        if not expected or x_step_up_token != expected:
            raise HTTPException(
                status_code=403,
                detail={"code": "step_up_required", "message": "Missing or invalid step-up token"},
            )

    return dep


def oidc_guard(cfg: ConfigHolder):
    def dep(
        request: Request,
        authorization: str = Header(default=""),
        x_audience: str = Header(default=""),
    ) -> Dict[str, Any]:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail={"code": "unauthorized", "message": "Missing Bearer token"},
            )
        id_token = authorization.split(" ", 1)[1]
        try:
            claims = verify_oidc(cfg, id_token, audience=x_audience or None)
            request.state.oidc_claims = claims
            return claims
        except Exception as exc:  # pragma: no cover - fastapi converts to 401
            raise HTTPException(
                status_code=401,
                detail={"code": "unauthorized", "message": str(exc)},
            ) from exc

    return dep


def rate_limit_guard(cfg: ConfigHolder, per_endpoint: bool = True):
    async def dep(request: Request) -> None:
        rate_cfg = getattr(cfg.current, "rate_limits", {}) or {}

        global_rpm = int(rate_cfg.get("global_per_minute", 0))
        if global_rpm:
            global_burst = int(rate_cfg.get("global_burst", global_rpm))
            ok, retry_after = await _bucket("__global__", global_rpm, global_burst).take(1)
            if not ok:
                headers = {"Retry-After": str(max(1, math.ceil(retry_after)))}
                raise HTTPException(
                    status_code=429,
                    detail={"code": "rate_limited", "message": "Too many requests"},
                    headers=headers,
                )

        claims = getattr(request.state, "oidc_claims", None)
        caller: Optional[str] = None
        if isinstance(claims, dict):
            caller = claims.get("sub")
        if not caller:
            caller = request.headers.get("X-Caller")
        if not caller and request.client:
            caller = request.client.host
        caller = caller or "anonymous"

        route = request.scope.get("route")
        path = getattr(route, "path", request.url.path)
        method = request.method
        endpoint_key = f"{method} {path}"

        endpoint_limits = {}
        endpoints_cfg = rate_cfg.get("endpoints", {}) or {}
        if endpoint_key in endpoints_cfg:
            endpoint_limits = endpoints_cfg[endpoint_key]

        default_rpm = int(rate_cfg.get("per_caller_per_minute", 60))
        rpm = int(endpoint_limits.get("per_minute", default_rpm))
        burst_default = endpoint_limits.get("per_minute", default_rpm)
        burst = int(endpoint_limits.get("burst", burst_default))

        key = caller
        if per_endpoint:
            key = f"{caller}|{endpoint_key}"

        ok, retry_after = await _bucket(key, rpm, burst).take(1)
        if not ok:
            headers = {"Retry-After": str(max(1, math.ceil(retry_after)))}
            raise HTTPException(
                status_code=429,
                detail={"code": "rate_limited", "message": "Too many requests"},
                headers=headers,
            )

    return dep
