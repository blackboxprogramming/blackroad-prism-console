import pytest

from roadview.models import Domain, IndexRequestDocument


@pytest.mark.asyncio
async def test_bulk_index_skips_blocked_domain(repository):
    domain = Domain(name="blocked.example", policy="block")
    await repository.upsert_domain(domain)
    doc = IndexRequestDocument(
        title="Blocked",
        url="https://blocked.example/news",
        sourceType="news",
        content="Important coverage about infrastructure.",
    )
    indexed = await repository.bulk_index_documents([doc])
    assert indexed == 0


@pytest.mark.asyncio
async def test_query_documents_respects_noindex(repository):
    domain = Domain(name="noindex.example", policy="noindex")
    await repository.upsert_domain(domain)
    doc = IndexRequestDocument(
        title="Hidden",
        url="https://noindex.example/post",
        sourceType="blog",
        content="Thorough analysis of governance policy and public data." * 50,
    )
    await repository.bulk_index_documents([doc])
    results = await repository.query_documents()
    assert all(row[1].name != "noindex.example" for row in results)
