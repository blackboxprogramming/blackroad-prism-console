"""Request guard that applies maintenance, step-up, and break-glass logic."""

from fastapi import HTTPException, Request, status

from .audit import AuditLogger
from .breakglass import BreakGlassContext, BreakGlassGate
from .config import ConfigLoader


class AccessGuard:
    """FastAPI dependency enforcing Autopal access requirements."""

    def __init__(self, loader: ConfigLoader, gate: BreakGlassGate, audit_logger: AuditLogger) -> None:
        self._loader = loader
        self._gate = gate
        self._audit = audit_logger

    async def __call__(self, request: Request) -> BreakGlassContext | None:
        config = self._loader.get()
        route = request.scope.get("route")
        route_template = route.path if route else request.url.path
        method = request.method.upper()
        path = request.url.path

        context = self._gate.evaluate(request, method, path, route_template, config)
        if not config.feature_flags.global_enabled and context is None:
            caller = request.client.host if request.client else None
            self._audit.log(config.audit, "maintenance.block", endpoint=route_template, caller=caller)
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Autopal is in maintenance mode")

        if config.feature_flags.require_step_up:
            approved = str(request.headers.get("X-Step-Up-Approved", "")).lower()
            if approved not in {"true", "1", "yes"}:
                self._audit.log(config.audit, "step_up.required", endpoint=route_template)
                raise HTTPException(status.HTTP_428_PRECONDITION_REQUIRED, "Step-up approval required")

        return context


__all__ = ["AccessGuard"]
