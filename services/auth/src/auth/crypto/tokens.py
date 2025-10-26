from __future__ import annotations

import datetime as dt
import uuid
from typing import Any, Dict

from ..config import Settings
from ..repo import RefreshTokenRepository, RevokedJTIRepository, UserRepository
from .jwt import JWTService


class TokenService:
    def __init__(self, settings: Settings, jwt_service: JWTService, refresh_repo: RefreshTokenRepository, revoked_repo: RevokedJTIRepository, user_repo: UserRepository):
        self.settings = settings
        self.jwt_service = jwt_service
        self.refresh_repo = refresh_repo
        self.revoked_repo = revoked_repo
        self.user_repo = user_repo

    def _now(self) -> dt.datetime:
        return dt.datetime.now(dt.timezone.utc)

    def _access_expiry(self) -> dt.datetime:
        return self._now() + dt.timedelta(minutes=self.settings.jwt_access_ttl_minutes)

    def _refresh_expiry(self) -> dt.datetime:
        return self._now() + dt.timedelta(days=self.settings.jwt_refresh_ttl_days)

    async def issue_tokens(self, *, user_id: uuid.UUID, scope: str, fingerprint: str | None) -> Dict[str, Any]:
        access_jti = uuid.uuid4()
        refresh_jti = uuid.uuid4()
        access_claims = {
            "iss": self.settings.jwt_issuer,
            "sub": str(user_id),
            "scope": scope,
            "iat": int(self._now().timestamp()),
            "exp": int(self._access_expiry().timestamp()),
            "jti": str(access_jti),
        }
        access_token = self.jwt_service.encode(access_claims)

        refresh_expires = self._refresh_expiry()
        refresh_claims = {
            "iss": self.settings.jwt_issuer,
            "sub": str(user_id),
            "type": "refresh",
            "iat": int(self._now().timestamp()),
            "exp": int(refresh_expires.timestamp()),
            "jti": str(refresh_jti),
        }
        if fingerprint:
            refresh_claims["fp"] = fingerprint
        refresh_token = self.jwt_service.encode(refresh_claims)
        await self.refresh_repo.create(
            user_id=user_id,
            token=refresh_token,
            fingerprint=fingerprint,
            expires_at=refresh_expires,
        )
        return {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "expiresIn": self.settings.jwt_access_ttl_minutes * 60,
            "tokenType": "Bearer",
        }

    async def rotate_refresh(self, *, refresh_token: str, fingerprint: str | None) -> Dict[str, Any]:
        existing = await self.refresh_repo.get_active_token(refresh_token)
        if not existing:
            raise ValueError("invalid_refresh")
        if existing.fingerprint:
            if existing.fingerprint != fingerprint:
                await self.refresh_repo.revoke(existing)
                raise ValueError("fingerprint_mismatch")
        await self.refresh_repo.revoke(existing)
        user = await self.user_repo.get_by_id(existing.user_id)
        scope = user.scope if user else "user:read"
        return await self.issue_tokens(user_id=existing.user_id, scope=scope, fingerprint=fingerprint or existing.fingerprint)

    async def revoke_refresh(self, refresh_token: str) -> None:
        existing = await self.refresh_repo.get_active_token(refresh_token)
        if existing:
            await self.refresh_repo.revoke(existing)

    async def revoke_access(self, jti: uuid.UUID) -> None:
        await self.revoked_repo.add(jti)

    async def is_access_revoked(self, jti: uuid.UUID) -> bool:
        return await self.revoked_repo.is_revoked(jti)
