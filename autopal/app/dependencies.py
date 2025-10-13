"""Reusable FastAPI dependencies."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import Depends, Header, HTTPException, Request

from .config import AppConfig, ConfigError, load_config
from .dual_control import DualControlError, DualControlRegistry
from .environment_control import EnvironmentRegistry
from .metrics import increment
from .rate_limiter import InMemoryRateLimiter, RateLimitExceeded


def get_config(request: Request) -> AppConfig:
    """Return the active application configuration."""

    return request.app.state.config


def get_dual_control_registry(request: Request) -> DualControlRegistry:
    """Return the dual control registry from the application state."""

    return request.app.state.dual_control


def get_environment_registry(request: Request) -> EnvironmentRegistry:
    """Return the environment registry from the application state."""

    return request.app.state.environment_registry


def enforce_security(path: str):
    """Return a dependency callable that enforces security for ``path``."""

    async def dependency(
        request: Request,
        audience: Optional[str] = Header(default=None, alias="X-Audience"),
        step_up: Optional[str] = Header(default=None, alias="X-Step-Up-Approved"),
        x_approval_id: Optional[str] = Header(default=None, alias="X-Approval-Id"),
        authorization: Optional[str] = Header(default=None, alias="Authorization"),
        config: AppConfig = Depends(get_config),
        dual_control: DualControlRegistry = Depends(get_dual_control_registry),
    ) -> None:
        if not config.global_enabled:
            increment("maintenance.block")
            raise HTTPException(status_code=503, detail="Service is currently disabled")

        policy = config.policy_for(path)

        if policy.required_audience:
            if audience is None:
                raise HTTPException(status_code=403, detail="Missing audience header")
            if audience not in policy.required_audience:
                raise HTTPException(status_code=403, detail="Unauthorized audience")

        if policy.step_up_required:
            if step_up is None:
                increment("step_up.required")
                raise HTTPException(status_code=403, detail="Step-up approval required")
            if step_up.lower() not in {"true", "1", "yes"}:
                increment("step_up.required")
                raise HTTPException(status_code=403, detail="Invalid step-up header value")

        if policy.dual_control_required:
            if x_approval_id is None:
                raise HTTPException(status_code=403, detail="Dual-control approval required")
            try:
                approval_record = await dual_control.consume(x_approval_id, context=path)
            except DualControlError as exc:
                raise HTTPException(status_code=403, detail=str(exc)) from exc
            else:
                request.state.dual_control_record = approval_record

        if policy.rate_limit is not None:
            limiter: InMemoryRateLimiter = request.app.state.rate_limiter
            caller = authorization or (request.client.host if request.client else None) or "anonymous"
            key = (path, caller)
            try:
                await limiter.hit(key, policy.rate_limit.limit, policy.rate_limit.window_seconds)
            except RateLimitExceeded as exc:
                increment("rate_limit.rejected")
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded",
                    headers={"Retry-After": f"{int(exc.retry_after) + 1}"},
                ) from exc

    return dependency


def load_initial_config(path: Path) -> AppConfig:
    """Load configuration during application startup."""

    try:
        return load_config(path)
    except ConfigError as exc:
        raise RuntimeError(str(exc)) from exc
