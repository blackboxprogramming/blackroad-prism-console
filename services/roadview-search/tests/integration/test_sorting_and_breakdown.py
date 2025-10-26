import json
from importlib import reload

import pytest
from httpx import ASGITransport, AsyncClient

import roadview.config
import roadview.main
from roadview.models import DomainUpsert, IndexRequestDocument


@pytest.mark.asyncio
async def test_sorting_and_pagination(tmp_path, monkeypatch):
    db_path = tmp_path / "sorting.db"
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
                json=json.loads(DomainUpsert(name="domain-a", baseCred=70).json()),
            )
            await client.post(
                "/api/domains",
                json=json.loads(DomainUpsert(name="domain-b", baseCred=95).json()),
            )
            docs = [
                IndexRequestDocument(
                    title="Older Article",
                    url="https://domain-a/older",
                    domain="domain-a",
                    sourceType="news",
                    publishedAt="2018-01-01T00:00:00Z",
                    content="Older insights on policy and accountability." * 30,
                ),
                IndexRequestDocument(
                    title="Recent Article",
                    url="https://domain-b/recent",
                    domain="domain-b",
                    sourceType="news",
                    publishedAt="2024-03-01T00:00:00Z",
                    content="Recent insights on policy with supporting data." * 30,
                ),
                IndexRequestDocument(
                    title="Newest Article",
                    url="https://domain-b/newest",
                    domain="domain-b",
                    sourceType="news",
                    publishedAt="2024-04-01T00:00:00Z",
                    content="Newest insights on governance with strong sourcing." * 30,
                ),
            ]
            await client.post(
                "/api/index/bulk",
                json={"docs": [json.loads(doc.json()) for doc in docs]},
            )

            recency_response = await client.get(
                "/api/search",
                params={"q": "policy insights", "sort": "recency"},
            )
            assert recency_response.status_code == 200
            recency_payload = recency_response.json()
            assert recency_payload["results"][0]["title"] == "Newest Article"

            credibility_response = await client.get(
                "/api/search",
                params={"q": "policy", "sort": "credibility", "pageSize": 2},
            )
            assert credibility_response.status_code == 200
            credibility_payload = credibility_response.json()
            assert credibility_payload["results"][0]["domain"] == "domain-b"
            assert credibility_payload["meta"]["total"] == 3
            assert credibility_payload["meta"]["pageSize"] == 2

            domain_response = await client.get(
                "/api/search",
                params={"q": "policy", "sort": "domain"},
            )
            assert domain_response.status_code == 200
            domain_payload = domain_response.json()
            domains_order = [result["domain"] for result in domain_payload["results"]]
            assert domains_order == sorted(domains_order)
    finally:
        await app.router.shutdown()
