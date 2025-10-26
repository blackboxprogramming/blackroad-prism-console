from importlib import reload

import pytest
from httpx import ASGITransport, AsyncClient

import roadview.config
import roadview.main


@pytest.mark.asyncio
async def test_openapi_contract_available(tmp_path, monkeypatch):
    db_path = tmp_path / "contract.db"
    monkeypatch.setenv("ROADVIEW_DB_URL", f"sqlite+aiosqlite:///{db_path}")
    monkeypatch.setenv("ROADVIEW_ENV", "test")
    reload(roadview.config)
    reload(roadview.main)
    app = roadview.main.app

    await app.router.startup()
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/openapi.json")
            assert response.status_code == 200
            spec = response.json()
            assert "/api/search" in spec["paths"]
            assert spec["info"]["title"] == "RoadView Search Service"
    finally:
        await app.router.shutdown()
