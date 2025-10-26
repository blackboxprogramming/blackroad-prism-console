import pytest
from httpx import AsyncClient

from roadview.main import app


@pytest.mark.asyncio
async def test_facets_and_filters_behaviour():
    async with AsyncClient(app=app, base_url="http://test") as client:
        payload = {
            "docs": [
                {
                    "title": "Left leaning analysis",
                    "url": "https://analysis.left.com/post",
                    "sourceType": "blog",
                    "bias": "left",
                    "publishedAt": "2024-02-01",
                    "content": "Policy analysis from left perspective",
                },
                {
                    "title": "Right leaning report",
                    "url": "https://reports.right.com/post",
                    "sourceType": "news",
                    "bias": "right",
                    "publishedAt": "2024-01-15",
                    "content": "Policy report from right perspective",
                },
            ]
        }
        await client.post("/api/index/bulk", json=payload)

        response = await client.get("/api/search", params={"q": "policy"})
        data = response.json()
        assert data["facets"]["bias"]["left"] == 1
        assert data["facets"]["bias"]["right"] == 1
        assert data["meta"]["page"] == 1
        assert data["meta"]["pageSize"] == 25

        filtered = await client.get("/api/search", params={"q": "policy", "bias": "left"})
        filtered_data = filtered.json()
        assert filtered_data["meta"]["total"] == 1
        assert filtered_data["results"][0]["bias"] == "left"
