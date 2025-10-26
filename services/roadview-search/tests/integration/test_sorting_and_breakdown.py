import pytest
from httpx import AsyncClient

from roadview.main import app


@pytest.mark.asyncio
async def test_sorting_orders_and_breakdown_sums():
    async with AsyncClient(app=app, base_url="http://test") as client:
        payload = {
            "docs": [
                {
                    "title": "Old brief note",
                    "url": "https://archive.example.com/old",
                    "sourceType": "blog",
                    "bias": "na",
                    "publishedAt": "2010-01-01",
                    "content": "Short post",
                },
                {
                    "title": "Fresh detailed analysis",
                    "url": "https://news.example.com/fresh",
                    "sourceType": "news",
                    "bias": "center",
                    "publishedAt": "2024-03-01",
                    "content": "Detailed analysis with author attribution and canonical references." * 5,
                    "author": "Analyst",
                    "hasCanonical": True
                },
            ]
        }
        await client.post("/api/index/bulk", json=payload)

        response = await client.get("/api/search", params={"q": "analysis", "sort": "recency"})
        results = response.json()["results"]
        assert results[0]["title"] == "Fresh detailed analysis"

        breakdown = results[0]["scoreBreakdown"]
        total = sum(breakdown.values())
        assert pytest.approx(total, rel=1e-5) == results[0]["score"]

        domain_sorted = await client.get("/api/search", params={"q": "analysis", "sort": "domain"})
        domains = [item["domain"] for item in domain_sorted.json()["results"]]
        assert domains == sorted(domains)
