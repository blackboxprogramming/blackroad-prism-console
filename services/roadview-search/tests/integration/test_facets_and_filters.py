import json
from importlib import reload

import pytest
from httpx import ASGITransport, AsyncClient

import roadview.config
import roadview.main
from roadview.models import DomainUpsert, IndexRequestDocument


@pytest.mark.asyncio
async def test_facets_and_filters(tmp_path, monkeypatch):
    db_path = tmp_path / "facets.db"
    monkeypatch.setenv("ROADVIEW_DB_URL", f"sqlite+aiosqlite:///{db_path}")
    monkeypatch.setenv("ROADVIEW_ENV", "test")
    reload(roadview.config)
    reload(roadview.main)
    app = roadview.main.app

    await app.router.startup()
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            await client.post(
                "/api/domains",
                json=json.loads(
                    DomainUpsert(name="trusted.example", baseCred=90, bias="center").json()
                ),
            )
            docs = [
                IndexRequestDocument(
                    title="Trusted Update",
                    url="https://trusted.example/update",
                    domain="trusted.example",
                    sourceType="news",
                    bias="center",
                    publishedAt="2024-02-01T00:00:00Z",
                    content="Trusted news coverage with verified data." * 20,
                    hasCanonical=True,
                ),
                IndexRequestDocument(
                    title="Community Blog",
                    url="https://blog.example/community",
                    sourceType="blog",
                    bias="left",
                    publishedAt="2023-08-20T00:00:00Z",
                    content="Community perspectives on local governance and fairness." * 20,
                ),
            ]
            await client.post(
                "/api/index/bulk",
                json={"docs": [json.loads(doc.json()) for doc in docs]},
            )

            response = await client.get(
                "/api/search",
                params={"q": "governance data", "bias": "center"},
            )
            assert response.status_code == 200
            payload = response.json()
            assert payload["meta"]["total"] == 1
            assert payload["results"][0]["domain"] == "trusted.example"
            facets = payload["facets"]
            assert facets["bias"]["center"] == 1
            assert "left" not in facets["bias"]

            cred_response = await client.get(
                "/api/search",
                params={"q": "governance", "minCred": 80},
            )
            assert cred_response.status_code == 200
            cred_payload = cred_response.json()
            assert all(result["credScore"] >= 80 for result in cred_payload["results"])
    finally:
        await app.router.shutdown()
