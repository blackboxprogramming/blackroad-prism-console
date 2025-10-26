import pytest
from httpx import AsyncClient

from roadview.main import app


@pytest.mark.asyncio
async def test_bulk_ingest_and_search_flow():
    async with AsyncClient(app=app, base_url="http://test") as client:
        payload = {
            "docs": [
                {
                    "title": "Science policy update",
                    "url": "https://updates.example.com/science",
                    "sourceType": "news",
                    "bias": "center",
                    "publishedAt": "2024-01-10",
                    "content": "Science policy update with new funding for research institutions.",
                    "author": "Reporter",
                },
                {
                    "title": "Government issues health advisory",
                    "url": "https://gov.example.com/health",
                    "sourceType": "gov",
                    "bias": "na",
                    "publishedAt": "2024-01-05",
                    "content": "Health advisory for citizens with safety recommendations and statistics.",
                    "author": "Agency",
                },
            ]
        }
        ingest_response = await client.post("/api/index/bulk", json=payload)
        assert ingest_response.status_code == 200
        assert ingest_response.json()["indexed"] == 2

        search_response = await client.get("/api/search", params={"q": "health"})
        body = search_response.json()
        assert body["meta"]["total"] >= 1
        assert all("scoreBreakdown" in result for result in body["results"])
        assert body["facets"]["domains"]
        assert body["meta"]["page"] == 1
