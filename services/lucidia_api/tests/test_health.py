import pathlib
import sys
import pytest

pytest.importorskip("httpx", reason="Install httpx or ask codex for help")

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.append(str(ROOT))
pytest.importorskip("app.routes", reason="Missing app.routes; ask codex for help")

from httpx import AsyncClient
from services.lucidia_api.main import app


@pytest.mark.asyncio
async def test_health() -> None:
    async with AsyncClient(app=app, base_url="http://test") as ac:
        resp = await ac.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
