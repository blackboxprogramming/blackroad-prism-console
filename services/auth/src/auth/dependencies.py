from __future__ import annotations

from typing import AsyncGenerator

from fastapi import Depends
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession, create_async_engine, sessionmaker

from .config import Settings, get_settings
from .crypto.jwt import JWTService
from .crypto.tokens import TokenService
from .repo import RefreshTokenRepository, RevokedJTIRepository, UserRepository

_settings = get_settings()
_engine = create_async_engine(_settings.database_url, future=True, echo=False)
_session_factory = sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)

def configure_dependencies(settings: Settings) -> None:
    global _settings, _engine, _session_factory
    _settings = settings
    _engine = create_async_engine(_settings.database_url, future=True, echo=False)
    _session_factory = sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    async with _engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _session_factory() as session:
        yield session


def get_jwt_service() -> JWTService:
    return JWTService(_settings)


def get_refresh_repo(session: AsyncSession = Depends(get_session)) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


def get_user_repository(session: AsyncSession = Depends(get_session)) -> UserRepository:
    return UserRepository(session)


def get_revoked_repo(session: AsyncSession = Depends(get_session)) -> RevokedJTIRepository:
    return RevokedJTIRepository(session)


def get_token_service(session: AsyncSession = Depends(get_session)) -> TokenService:
    jwt_service = get_jwt_service()
    refresh_repo = RefreshTokenRepository(session)
    revoked_repo = RevokedJTIRepository(session)
    user_repo = UserRepository(session)
    return TokenService(_settings, jwt_service, refresh_repo, revoked_repo, user_repo)
