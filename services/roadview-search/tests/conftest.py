from __future__ import annotations

import asyncio
import os
from pathlib import Path

import pytest
from sqlalchemy import delete

TEST_DB_PATH = Path(__file__).resolve().parent / "test.db"
os.environ["ROADVIEW_DB_URL"] = f"sqlite+aiosqlite:///{TEST_DB_PATH}"

from roadview import repo
from roadview.models import Document, Domain
from roadview.main import app


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def reset_db():
    await repo.init_db()
    async with repo.get_session() as session:
        await session.exec(delete(Document))
        await session.exec(delete(Domain))
        await session.commit()
    yield
    async with repo.get_session() as session:
        await session.exec(delete(Document))
        await session.exec(delete(Domain))
        await session.commit()


@pytest.fixture
def test_app():
    return app
