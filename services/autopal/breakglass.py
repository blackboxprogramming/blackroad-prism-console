"""Break-glass admission checks."""

from __future__ import annotations

import os
import re
import time
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from fastapi import HTTPException, Request, status
from jwt import InvalidTokenError

from .audit import AuditLogger
from .config import AppConfig, BreakGlassConfig


@dataclass
class BreakGlassContext:
    """Context returned when a break-glass token is accepted."""

    subject: str
    issued_at: int
    expires_at: int
    endpoint: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "subject": self.subject,
            "issued_at": self.issued_at,
            "expires_at": self.expires_at,
            "endpoint": self.endpoint,
        }


class BreakGlassGate:
    """Validate break-glass headers and emit audit events."""

    HEADER = "X-Break-Glass"

    def __init__(self, audit_logger: AuditLogger) -> None:
        self._audit = audit_logger

    def evaluate(
        self,
        request: Request,
        method: str,
        path: str,
        route_template: str,
        config: AppConfig,
    ) -> BreakGlassContext | None:
        token = request.headers.get(self.HEADER)
        if not token:
            return None

        cfg = config.break_glass
        if not cfg.enabled:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Break-glass is disabled")
        if not self._is_allowlisted(method, path, cfg):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Break-glass not permitted for this endpoint")

        secret = os.getenv(cfg.hmac_secret_env)
        if not secret:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Break-glass secret is not configured")

        try:
            claims = jwt.decode(
                token,
                secret,
                algorithms=[cfg.alg],
                options={"require": ["sub", "iat", "exp"]},
            )
        except InvalidTokenError as exc:  # pragma: no cover - PyJWT raises numerous subclasses
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid break-glass token") from exc

        subject = str(claims.get("sub"))
        if subject not in cfg.allowed_subjects:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Subject not authorised for break-glass")

        try:
            issued_at = int(claims.get("iat"))
            expires_at = int(claims.get("exp"))
        except (TypeError, ValueError) as exc:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid break-glass token timing claims") from exc

        now = int(time.time())
        if expires_at <= issued_at or expires_at <= now:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Break-glass token expired")
        if (expires_at - issued_at) > cfg.ttl_seconds:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Break-glass token exceeds permitted TTL")

        context = BreakGlassContext(
            subject=subject,
            issued_at=issued_at,
            expires_at=expires_at,
            endpoint=route_template,
        )
        self._audit.log(
            config.audit,
            "break_glass.accepted",
            sub=subject,
            iat=issued_at,
            exp=expires_at,
            endpoint=route_template,
        )
        return context

    def _is_allowlisted(self, method: str, path: str, cfg: BreakGlassConfig) -> bool:
        method_upper = method.upper()
        for entry in cfg.allowlist_endpoints:
            entry_method, entry_path = entry.split(" ", 1)
            if entry_method.upper() != method_upper:
                continue
            pattern = self._compiled_pattern(entry_path)
            if pattern.fullmatch(path):
                return True
        return False

    def is_allowlisted(self, method: str, path: str, cfg: BreakGlassConfig) -> bool:
        """Public wrapper around the allowlist matcher."""

        return self._is_allowlisted(method, path, cfg)

    @staticmethod
    @lru_cache(maxsize=64)
    def _compiled_pattern(template: str) -> re.Pattern[str]:
        regex = re.sub(r"\{[^/]+\}", "[^/]+", template)
        return re.compile(f"^{regex}$")


__all__ = ["BreakGlassContext", "BreakGlassGate"]
