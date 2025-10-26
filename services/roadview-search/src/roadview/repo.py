from __future__ import annotations

import json
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, List, Optional
from urllib.parse import urlparse
from uuid import uuid4

from dateutil import parser as date_parser
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from .models import BiasEnum, Domain, DomainPolicyEnum, Document, IndexRequestDocument, SourceTypeEnum
from .services.tokenizer import Tokenizer


@dataclass
class RepositoryConfig:
    db_url: str


class RoadviewRepository:
    def __init__(self, engine: AsyncEngine, tokenizer: Tokenizer):
        self._engine = engine
        self._tokenizer = tokenizer
        self._session_factory = sessionmaker(
            engine, expire_on_commit=False, class_=AsyncSession
        )

    @property
    def engine(self) -> AsyncEngine:
        return self._engine

    @asynccontextmanager
    async def session(self) -> Iterable[AsyncSession]:
        async with self._session_factory() as session:
            yield session

    async def init_db(self) -> None:
        async with self._engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)

    async def list_domains(self) -> List[Domain]:
        async with self.session() as session:
            result = await session.execute(select(Domain))
            domains = result.scalars().all()
        return list(domains)

    async def upsert_domain(self, payload: Domain) -> tuple[Domain, bool]:
        async with self.session() as session:
            payload.updatedAt = datetime.utcnow()
            domain = await session.get(Domain, payload.name)
            created = domain is None
            if domain:
                for field in ("displayName", "bias", "baseCred", "policy"):
                    setattr(domain, field, getattr(payload, field))
                domain.updatedAt = payload.updatedAt
            else:
                domain = payload
                session.add(domain)
            await session.commit()
            await session.refresh(domain)
        return domain, created

    async def ensure_domain(self, name: str) -> Domain:
        domain = Domain(name=name)
        domain, _ = await self.upsert_domain(domain)
        return domain

    async def bulk_index_documents(self, docs: List[IndexRequestDocument]) -> int:
        indexed = 0
        async with self.session() as session:
            for payload in docs:
                normalized = await self._normalize_index_payload(session, payload)
                if not normalized:
                    continue
                session.add(normalized)
                indexed += 1
            await session.commit()
        return indexed

    async def _normalize_index_payload(
        self, session: AsyncSession, payload: IndexRequestDocument
    ) -> Optional[Document]:
        domain_name = payload.domain or self._extract_domain(payload.url)
        if not domain_name:
            return None
        domain = await session.get(Domain, domain_name)
        if domain is None:
            domain = Domain(name=domain_name)
            session.add(domain)
            await session.flush()
        elif domain.policy == DomainPolicyEnum.block:
            return None

        published_at = self._parse_date(payload.publishedAt)
        tokens = self._tokenizer.tokenize(payload.content)
        if not tokens:
            return None

        has_author = bool(payload.author)
        has_date = bool(published_at)
        has_canonical = bool(payload.hasCanonical)
        snippet = payload.content.strip().replace("\n", " ")[:320]
        bias = payload.bias if payload.bias != BiasEnum.na else domain.bias
        document = Document(
            id=str(uuid4()),
            title=payload.title,
            snippet=snippet,
            url=payload.url,
            domain=domain.name,
            sourceType=payload.sourceType,
            bias=bias,
            credScore=domain.baseCred,
            publishedAt=published_at,
            content=payload.content,
            author=payload.author,
            hasCanonical=has_canonical,
            hasAuthor=has_author,
            hasDate=has_date,
            tokens=" ".join(tokens),
        )
        return document

    async def curated_seed_count(self, path: str) -> int:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        docs = [IndexRequestDocument(**item) for item in data.get("docs", [])]
        return await self.bulk_index_documents(docs)

    async def get_corpus_size(self) -> int:
        async with self.session() as session:
            result = await session.execute(select(Document))
            return len(result.scalars().all())

    async def get_domains_count(self) -> int:
        async with self.session() as session:
            result = await session.execute(select(Domain))
            return len(result.scalars().all())

    async def get_documents_for_search(self) -> list[tuple[Document, Domain]]:
        async with self.session() as session:
            result = await session.execute(select(Document, Domain).join(Domain))
            rows = result.all()
        return [(row[0], row[1]) for row in rows]

    async def query_documents(
        self,
        *,
        source_type: Optional[SourceTypeEnum] = None,
        bias: Optional[BiasEnum] = None,
        min_cred: Optional[int] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
    ) -> list[tuple[Document, Domain]]:
        async with self.session() as session:
            stmt = select(Document, Domain).join(Domain)
            if source_type:
                stmt = stmt.where(Document.sourceType == source_type)
            if bias:
                stmt = stmt.where(Document.bias == bias)
            if min_cred is not None:
                stmt = stmt.where(Document.credScore >= min_cred)
            if from_date:
                stmt = stmt.where(Document.publishedAt >= from_date)
            if to_date:
                stmt = stmt.where(Document.publishedAt <= to_date)
            stmt = stmt.where(Domain.policy != DomainPolicyEnum.block)
            result = await session.execute(stmt)
            rows = [row for row in result.all() if row[1].policy != DomainPolicyEnum.noindex]
        return [(row[0], row[1]) for row in rows]

    async def upsert_domains_bulk(self, domains: List[Domain]) -> List[Domain]:
        saved: List[Domain] = []
        for domain in domains:
            saved_domain, _ = await self.upsert_domain(domain)
            saved.append(saved_domain)
        return saved

    def _extract_domain(self, url: str) -> Optional[str]:
        try:
            parsed = urlparse(url)
        except ValueError:
            return None
        return parsed.netloc or None

    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        if not date_str:
            return None
        try:
            parsed = date_parser.parse(date_str)
        except (ValueError, TypeError, OverflowError):
            return None
        return parsed


def create_engine_from_config(config: RepositoryConfig) -> AsyncEngine:
    return create_async_engine(config.db_url, future=True, echo=False)


def create_repository(db_url: str, tokenizer: Tokenizer) -> RoadviewRepository:
    engine = create_async_engine(db_url, future=True, echo=False)
    return RoadviewRepository(engine, tokenizer)
