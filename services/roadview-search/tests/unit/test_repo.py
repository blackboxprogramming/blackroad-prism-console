import pytest

from roadview.models import BulkDocumentInput
from sqlmodel import select

from roadview.models import Document, PolicyEnum
from roadview.repo import bulk_index, get_domain, get_session, list_domains, upsert_domain


@pytest.mark.asyncio
async def test_bulk_index_creates_documents_and_tokens():
    doc = BulkDocumentInput(
        title="Test",
        url="https://example.com/article",
        sourceType="news",
        bias="center",
        publishedAt="2024-01-01",
        content="Example content with meaningful science insights",
        author="Reporter",
    )
    async with get_session() as session:
        count = await bulk_index(session, [doc])
        assert count == 1
        domains = await list_domains(session)
        assert domains[0].name == "example.com"
        result = await session.exec(select(Document))
        inserted_doc = result.first()
        assert inserted_doc is not None
        tokens = inserted_doc.tokens.split()
        assert "science" in tokens or "example" in tokens


@pytest.mark.asyncio
async def test_block_policy_prevents_ingest():
    async with get_session() as session:
        await upsert_domain(session, "blocked.com", policy="block")
        doc = BulkDocumentInput(
            title="Blocked",
            url="https://blocked.com/item",
            sourceType="blog",
            content="Content",  # type: ignore[arg-type]
        )
        count = await bulk_index(session, [doc])
        assert count == 0
        domain = await get_domain(session, "blocked.com")
        assert domain.policy == PolicyEnum.block
