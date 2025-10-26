import asyncio
from pathlib import Path

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine

from roadview.repo import RoadviewRepository
from roadview.services.tokenizer import Tokenizer


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def repository(tmp_path: Path) -> RoadviewRepository:
    db_path = tmp_path / "test.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}", future=True, echo=False)
    repo = RoadviewRepository(engine, Tokenizer())
    await repo.init_db()
    return repo
