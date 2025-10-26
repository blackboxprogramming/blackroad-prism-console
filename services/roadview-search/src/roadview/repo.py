from __future__ import annotations

import math
import uuid
from collections import Counter, defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator, Iterable, Sequence
from urllib.parse import urlparse

from dateutil import parser
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, select
from sqlmodel.ext.asyncio.session import AsyncSession

from .config import get_settings
from .models import BiasEnum, BulkDocumentInput, Document, Domain, PolicyEnum
from .services.tokenizer import tokenize


settings = get_settings()
engine: AsyncEngine = create_async_engine(settings.db_url, echo=False, future=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


def _extract_domain(url: str, override: str | None = None) -> str:
    if override:
        return override.lower()
    parsed = urlparse(url)
    return parsed.netloc.lower()


def _normalize_booleans(doc: BulkDocumentInput, content_tokens: list[str]) -> tuple[bool, bool, bool]:
    has_author = bool((doc.author or "").strip())
    has_date = doc.publishedAt is not None
    has_canonical = doc.hasCanonical if doc.hasCanonical is not None else "rel=\"canonical\"" in doc.content
    return has_author, has_date, has_canonical


def _parse_date(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        dt = parser.parse(raw)
        if not dt.tzinfo:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (ValueError, TypeError, OverflowError):
        return None


async def upsert_domain(
    session: AsyncSession,
    domain_name: str,
    *,
    display_name: str | None = None,
    bias: BiasEnum | str | None = None,
    base_cred: int | None = None,
    policy: PolicyEnum | str | None = None,
) -> Domain:
    stmt = select(Domain).where(Domain.name == domain_name)
    result = await session.exec(stmt)
    existing = result.one_or_none()
    now = datetime.now(timezone.utc)
    if existing:
        if display_name is not None:
            existing.displayName = display_name
        if bias is not None:
            existing.bias = BiasEnum(bias)
        if base_cred is not None:
            existing.baseCred = base_cred
        if policy is not None:
            existing.policy = PolicyEnum(policy)
        existing.updatedAt = now
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        existing.updatedAt = _ensure_timezone(existing.updatedAt)
        return existing
    domain = Domain(
        name=domain_name,
        displayName=display_name,
        bias=BiasEnum(bias) if bias is not None else BiasEnum.na,
        baseCred=base_cred or 60,
        policy=PolicyEnum(policy) if policy is not None else PolicyEnum.allow,
        updatedAt=now,
    )
    session.add(domain)
    await session.commit()
    await session.refresh(domain)
    domain.updatedAt = _ensure_timezone(domain.updatedAt)
    return domain


def _ensure_timezone(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


async def get_domain(session: AsyncSession, domain_name: str) -> Domain | None:
    stmt = select(Domain).where(Domain.name == domain_name)
    result = await session.exec(stmt)
    return result.one_or_none()


async def list_domains(session: AsyncSession) -> list[Domain]:
    stmt = select(Domain)
    result = await session.exec(stmt)
    return list(result)


def _tokenize_content(content: str) -> tuple[str, list[str]]:
    tokens = tokenize(content)
    return " ".join(tokens), tokens


def _tf(tokens: Iterable[str]) -> Counter[str]:
    counts: Counter[str] = Counter(tokens)
    total = sum(counts.values())
    for term in list(counts):
        counts[term] = counts[term] / total
    return counts


def compute_idf(documents: Sequence[list[str]]) -> dict[str, float]:
    doc_count = len(documents)
    df: defaultdict[str, int] = defaultdict(int)
    for tokens in documents:
        seen = set(tokens)
        for token in seen:
            df[token] += 1
    idf: dict[str, float] = {}
    for token, freq in df.items():
        idf[token] = math.log((doc_count + 1) / (freq + 1)) + 1
    return idf


def compute_tfidf(tokens: list[str], idf: dict[str, float]) -> dict[str, float]:
    tf = _tf(tokens)
    return {term: tf[term] * idf.get(term, 0.0) for term in tf}


async def bulk_index(session: AsyncSession, docs: list[BulkDocumentInput]) -> int:
    indexed = 0
    for doc in docs:
        domain_name = _extract_domain(doc.url, doc.domain)
        existing_domain = await get_domain(session, domain_name)
        if existing_domain and existing_domain.policy == PolicyEnum.block:
            continue
        if existing_domain is None:
            existing_domain = await upsert_domain(session, domain_name)
        elif existing_domain.policy == PolicyEnum.block:
            continue
        content_tokens_str, tokens = _tokenize_content(doc.content)
        has_author, has_date, has_canonical = _normalize_booleans(doc, tokens)
        published_at = _parse_date(doc.publishedAt)
        document = Document(
            id=str(uuid.uuid4()),
            title=doc.title,
            url=doc.url,
            domain=domain_name,
            sourceType=doc.sourceType,
            bias=doc.bias,
            publishedAt=published_at,
            content=doc.content,
            author=doc.author,
            hasCanonical=has_canonical,
            hasAuthor=has_author,
            hasDate=has_date,
            tokens=content_tokens_str,
        )
        session.add(document)
        indexed += 1
    await session.commit()
    return indexed


async def load_corpus(session: AsyncSession) -> list[Document]:
    stmt = select(Document)
    result = await session.exec(stmt)
    return list(result)


async def load_documents_with_domains(session: AsyncSession) -> list[tuple[Document, Domain]]:
    stmt = select(Document, Domain).join(Domain, Document.domain == Domain.name)
    result = await session.exec(stmt)
    return [(doc, domain) for doc, domain in result]


async def count_documents(session: AsyncSession) -> int:
    stmt = select(Document)
    result = await session.exec(stmt)
    return len(list(result))


async def count_domains(session: AsyncSession) -> int:
    stmt = select(Domain)
    result = await session.exec(stmt)
    return len(list(result))


def tokens_from_document(doc: Document) -> list[str]:
    return doc.tokens.split() if doc.tokens else []
