from __future__ import annotations

import datetime as dt
import hashlib
import uuid
from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from .models import RefreshToken, RevokedJTI, User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_user(self, email: str, password_hash: str, scope: str = "user:read") -> User:
        user = User(email=email.lower(), password_hash=password_hash, scope=scope)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.session.exec(select(User).where(User.email == email.lower()))
        return result.first()

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self.session.exec(select(User).where(User.id == user_id))
        return result.first()


class RefreshTokenRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    async def create(self, *, user_id: uuid.UUID, token: str, fingerprint: str | None, expires_at: dt.datetime) -> RefreshToken:
        token_hash = self.hash_token(token)
        refresh = RefreshToken(user_id=user_id, token_hash=token_hash, fingerprint=fingerprint, expires_at=expires_at)
        self.session.add(refresh)
        await self.session.commit()
        await self.session.refresh(refresh)
        return refresh

    async def get_active_token(self, token: str) -> Optional[RefreshToken]:
        token_hash = self.hash_token(token)
        result = await self.session.exec(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
        )
        refresh = result.first()
        if refresh and refresh.expires_at <= dt.datetime.now(dt.timezone.utc):
            return None
        return refresh

    async def revoke(self, refresh: RefreshToken) -> None:
        refresh.revoked_at = dt.datetime.now(dt.timezone.utc)
        self.session.add(refresh)
        await self.session.commit()

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        result = await self.session.exec(select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)))
        refreshes = result.all()
        for refresh in refreshes:
            refresh.revoked_at = dt.datetime.now(dt.timezone.utc)
            self.session.add(refresh)
        await self.session.commit()


class RevokedJTIRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, jti: uuid.UUID) -> None:
        record = RevokedJTI(jti=jti)
        self.session.add(record)
        await self.session.commit()

    async def is_revoked(self, jti: uuid.UUID) -> bool:
        result = await self.session.exec(select(RevokedJTI).where(RevokedJTI.jti == jti))
        return result.first() is not None
