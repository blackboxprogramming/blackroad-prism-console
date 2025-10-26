import pytest
from httpx import AsyncClient

from roadview.models import BulkDocumentInput
from roadview.repo import bulk_index, get_session, upsert_domain
from roadview.main import app


@pytest.mark.asyncio
async def test_noindex_domain_excluded_from_search():
    async with get_session() as session:
        await upsert_domain(session, "noindex.com", policy="noindex")
        doc = BulkDocumentInput(
            title="Hidden",
            url="https://noindex.com/post",
            sourceType="news",
            content="Hidden content",
        )
        await bulk_index(session, [doc])
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/search", params={"q": "hidden"})
    assert response.status_code == 200
    assert response.json()["meta"]["total"] == 0
