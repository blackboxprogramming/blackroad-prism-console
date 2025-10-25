import datetime as dt

import pytest
import pytest_asyncio
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession, create_async_engine, sessionmaker

from auth.models import User
from auth.repo import RefreshTokenRepository, UserRepository


@pytest_asyncio.fixture
async def session(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path}/repo.db", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as sess:
        yield sess


@pytest.mark.asyncio
async def test_user_repository_crud(session):
    repo = UserRepository(session)
    created = await repo.create_user("test@example.com", "hash")
    fetched = await repo.get_by_email("test@example.com")
    assert fetched.id == created.id


@pytest.mark.asyncio
async def test_refresh_repository(session):
    repo = RefreshTokenRepository(session)
    user_repo = UserRepository(session)
    user = await user_repo.create_user("user@example.com", "hash")
    future = user.created_at + dt.timedelta(hours=1)
    await repo.create(user_id=user.id, token="token", fingerprint=None, expires_at=future)
    stored = await repo.get_active_token("token")
    assert stored is not None
    await repo.revoke(stored)
    assert await repo.get_active_token("token") is None
