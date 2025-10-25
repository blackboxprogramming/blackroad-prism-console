from __future__ import annotations

import asyncio
import hashlib
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import jwt
from fastapi import HTTPException, status

try:  # pragma: no cover - optional dependency
    from redis.asyncio import Redis  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    Redis = None  # type: ignore


logger = logging.getLogger("ai_console.auth")

ROLE_LEVELS: Dict[str, int] = {"guest": 0, "member": 1, "admin": 2}
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


@dataclass
class Principal:
    """Represents the caller extracted from a verified JWT."""

    subject: str
    role: str
    expires_at: datetime
    refresh_expires_at: datetime


class SessionStore:
    """Abstract persistence layer for token expirations."""

    async def save_session(self, token_hash: str, payload: Dict[str, Any]) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    async def close(self) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    def snapshot(self) -> Dict[str, Dict[str, Any]]:  # pragma: no cover - interface
        return {}


class MemorySessionStore(SessionStore):
    """In-memory fallback for environments without Redis."""

    def __init__(self) -> None:
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def save_session(self, token_hash: str, payload: Dict[str, Any]) -> None:
        async with self._lock:
            self._sessions[token_hash] = payload

    async def close(self) -> None:  # pragma: no cover - nothing to close
        self._sessions.clear()

    def snapshot(self) -> Dict[str, Dict[str, Any]]:
        return dict(self._sessions)


class RedisSessionStore(SessionStore):
    """Redis-backed session persistence."""

    def __init__(self, redis: "Redis") -> None:  # type: ignore[valid-type]
        self._redis = redis

    async def save_session(self, token_hash: str, payload: Dict[str, Any]) -> None:
        data = {k: str(v) for k, v in payload.items()}
        expires_at = int(payload.get("refresh_expires_at", payload.get("expires_at", 0)))
        pipe = self._redis.pipeline()
        pipe.hset(token_hash, mapping=data)
        if expires_at:
            pipe.expireat(token_hash, expires_at)
        try:
            await pipe.execute()
        except Exception as exc:  # pragma: no cover - network failure
            logger.warning("redis session store write failed: %s", exc)

    async def close(self) -> None:
        try:
            await self._redis.close()
        except Exception:  # pragma: no cover - shutdown best effort
            logger.debug("redis close failed", exc_info=True)


async def build_session_store(url: Optional[str]) -> SessionStore:
    """Create a session store, preferring Redis when available."""

    if not url or url.startswith("memory://"):
        return MemorySessionStore()

    if Redis is None:  # pragma: no cover - import guard
        logger.warning("redis client not available, using in-memory session store")
        return MemorySessionStore()

    try:
        redis = Redis.from_url(url)  # type: ignore[attr-defined]
        await redis.ping()
        return RedisSessionStore(redis)
    except Exception as exc:  # pragma: no cover - redis unavailable
        logger.warning("unable to connect to redis at %s: %s", url, exc)
        if 'redis' in locals():
            try:
                await redis.close()  # type: ignore[name-defined]
            except Exception:
                logger.debug("redis close failed", exc_info=True)
        return MemorySessionStore()


class AuthManager:
    """JWT validation and session tracking for the AI console."""

    def __init__(
        self,
        *,
        secret: str,
        algorithm: str,
        audience: Optional[str],
        issuer: Optional[str],
        session_store: SessionStore,
        leeway_seconds: int = 0,
    ) -> None:
        self.secret = secret
        self.algorithm = algorithm
        self.audience = audience
        self.issuer = issuer
        self.session_store = session_store
        self.leeway_seconds = leeway_seconds

    async def authenticate(self, token: str) -> Principal:
        payload = self._decode(token, require_refresh=False)
        principal = self._principal_from_payload(payload)
        await self._persist(token, principal)
        return principal

    async def authenticate_refresh(self, token: str) -> Principal:
        payload = self._decode(token, require_refresh=True)
        principal = self._principal_from_payload(payload, refresh_override=payload.get("exp"))
        await self._persist(token, principal)
        return principal

    def has_role(self, role: str, required: str) -> bool:
        return ROLE_LEVELS.get(role, -1) >= ROLE_LEVELS.get(required, -1)

    async def record_tokens(self, tokens: Dict[str, str], role: str, subject: str, refresh_expires: datetime) -> None:
        for key, token in tokens.items():
            if not token:
                continue
            expires_at = refresh_expires if key == "refresh_token" else None
            payload = jwt.decode(
                token,
                self.secret,
                algorithms=[self.algorithm],
                options={"verify_signature": False, "verify_exp": False},
            )
            exp_value = payload.get("exp")
            refresh_value = payload.get("refresh_exp") or payload.get("refresh_expires_at")
            principal = Principal(
                subject=subject,
                role=role,
                expires_at=datetime.fromtimestamp(exp_value, tz=timezone.utc) if exp_value else refresh_expires,
                refresh_expires_at=datetime.fromtimestamp(
                    refresh_value, tz=timezone.utc
                )
                if refresh_value
                else refresh_expires,
            )
            await self._persist(token, principal)

    def _decode(self, token: str, *, require_refresh: bool) -> Dict[str, Any]:
        options = {"require": ["exp", "sub", "role"]}
        kwargs: Dict[str, Any] = {
            "key": self.secret,
            "algorithms": [self.algorithm],
            "options": options,
            "leeway": self.leeway_seconds,
        }
        if self.audience:
            kwargs["audience"] = self.audience
        if self.issuer:
            kwargs["issuer"] = self.issuer

        try:
            payload = jwt.decode(token, **kwargs)
        except jwt.ExpiredSignatureError as exc:  # pragma: no cover - validated via tests
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="token_expired") from exc
        except jwt.InvalidTokenError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_token") from exc

        token_use = payload.get("token_use") or payload.get("typ")
        if require_refresh and token_use not in {"refresh", "offline"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_refresh_token")
        return payload

    def _principal_from_payload(
        self,
        payload: Dict[str, Any],
        *,
        refresh_override: Optional[int] = None,
    ) -> Principal:
        role = payload.get("role")
        if role not in ROLE_LEVELS:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="role_not_authorized")

        expires_at = datetime.fromtimestamp(int(payload["exp"]), tz=timezone.utc)
        refresh_exp = refresh_override or payload.get("refresh_exp") or payload.get("refresh_expires_at")
        if refresh_exp is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="missing_refresh_exp")

        refresh_dt = datetime.fromtimestamp(int(refresh_exp), tz=timezone.utc)
        return Principal(
            subject=str(payload["sub"]),
            role=role,
            expires_at=expires_at,
            refresh_expires_at=refresh_dt,
        )

    async def _persist(self, token: str, principal: Principal) -> None:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        payload = {
            "subject": principal.subject,
            "role": principal.role,
            "expires_at": int(principal.expires_at.timestamp()),
            "refresh_expires_at": int(principal.refresh_expires_at.timestamp()),
        }
        try:
            await self.session_store.save_session(token_hash, payload)
        except Exception as exc:  # pragma: no cover - persistence best effort
            logger.warning("failed to persist session: %s", exc)


__all__ = [
    "AuthManager",
    "Principal",
    "ROLE_LEVELS",
    "SAFE_METHODS",
    "SessionStore",
    "MemorySessionStore",
    "RedisSessionStore",
    "build_session_store",
]
