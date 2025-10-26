import json
from importlib import reload

import pytest
from httpx import ASGITransport, AsyncClient

import roadview.config
import roadview.main
from roadview.models import IndexRequestDocument


@pytest.mark.asyncio
async def test_bulk_ingest_and_search(tmp_path, monkeypatch):
    db_path = tmp_path / "search.db"
    monkeypatch.setenv("ROADVIEW_DB_URL", f"sqlite+aiosqlite:///{db_path}")
    monkeypatch.setenv("ROADVIEW_ENV", "test")
    reload(roadview.config)
    reload(roadview.main)
    app = roadview.main.app

    docs = [
        IndexRequestDocument(
            title="Infrastructure Spotlight",
            url="https://news.integration.test/infra",
            sourceType="news",
            bias="center",
            publishedAt="2023-01-01T00:00:00Z",
            content="In-depth infrastructure plan with data and accountability." * 10,
            author="Jamie",
            hasCanonical=True,
        ),
        IndexRequestDocument(
            title="Policy Debate",
            url="https://blog.integration.test/policy",
            sourceType="blog",
            bias="left",
            publishedAt="2022-06-15T00:00:00Z",
            content="Policy debate explores equitable transit-oriented development." * 12,
            author="Sky",
            hasCanonical=False,
        ),
    ]

    await app.router.startup()
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/index/bulk",
                json={"docs": [json.loads(doc.json()) for doc in docs]},
            )
            assert response.status_code == 200
            assert response.json()["indexed"] == len(docs)

            search_response = await client.get("/api/search", params={"q": "infrastructure policy"})
            assert search_response.status_code == 200
            payload = search_response.json()
            assert payload["meta"]["total"] >= 2
            assert payload["results"][0]["scoreBreakdown"]
            top = payload["results"][0]
            breakdown = top["scoreBreakdown"]
            reconstructed = breakdown["text"] + breakdown["domain"] + breakdown["recency"] + breakdown["structure"] + breakdown["penalty"]
            assert pytest.approx(reconstructed, rel=1e-6) == top["score"]
    finally:
        await app.router.shutdown()
