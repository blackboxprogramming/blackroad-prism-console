from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Literal, Optional

from pydantic import field_serializer
from sqlmodel import Field, SQLModel

class BiasEnum(str, Enum):
    left = "left"
    center = "center"
    right = "right"
    na = "na"


class SourceEnum(str, Enum):
    journal = "journal"
    news = "news"
    blog = "blog"
    paper = "paper"
    gov = "gov"
    repo = "repo"


class PolicyEnum(str, Enum):
    allow = "allow"
    noindex = "noindex"
    block = "block"


class Domain(SQLModel, table=True):
    name: str = Field(primary_key=True)
    displayName: Optional[str] = None
    bias: BiasEnum = BiasEnum.na
    baseCred: int = Field(default=60, ge=0, le=100)
    policy: PolicyEnum = PolicyEnum.allow
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_serializer("updatedAt")
    def serialize_updated_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        else:
            value = value.astimezone(timezone.utc)
        return value.isoformat().replace("+00:00", "Z")


class Document(SQLModel, table=True):
    id: str = Field(primary_key=True)
    title: str
    url: str
    domain: str = Field(foreign_key="domain.name")
    sourceType: SourceEnum
    bias: BiasEnum = BiasEnum.na
    publishedAt: Optional[datetime] = None
    content: str
    author: Optional[str] = None
    hasCanonical: bool = False
    hasAuthor: bool = False
    hasDate: bool = False
    tokens: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_serializer("publishedAt")
    def serialize_published_at(self, value: datetime | None) -> Optional[str]:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        else:
            value = value.astimezone(timezone.utc)
        return value.isoformat().replace("+00:00", "Z")

    @field_serializer("createdAt")
    def serialize_created_at(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        else:
            value = value.astimezone(timezone.utc)
        return value.isoformat().replace("+00:00", "Z")


class DocumentWithDomain(SQLModel):
    document: Document
    domain: Domain


class DomainUpsert(SQLModel):
    name: str = Field(min_length=1)
    displayName: Optional[str] = None
    bias: BiasEnum = BiasEnum.na
    baseCred: int = Field(default=60, ge=0, le=100)
    policy: PolicyEnum = PolicyEnum.allow


class BulkDocumentInput(SQLModel):
    title: str
    url: str
    domain: Optional[str] = None
    sourceType: SourceEnum
    bias: BiasEnum = BiasEnum.na
    publishedAt: Optional[str] = None
    content: str
    author: Optional[str] = None
    hasCanonical: Optional[bool] = None


class BulkIndexRequest(SQLModel):
    docs: list[BulkDocumentInput]


class BulkIndexResponse(SQLModel):
    indexed: int


class CuratedSeedResponse(SQLModel):
    indexed: int


class SearchQuery(SQLModel):
    q: str
    sourceType: Optional[SourceEnum] = None
    bias: Optional[BiasEnum] = None
    minCred: Optional[int] = None
    from_: Optional[str] = Field(default=None, alias="from")
    to: Optional[str] = None
    sort: Optional[Literal["recency", "credibility", "domain", "relevance"]] = None
    page: Optional[int] = 1
    pageSize: Optional[int] = None


class ScoreBreakdown(SQLModel):
    text: float
    domain: float
    recency: float
    structure: float
    penalty: float


class SearchResult(SQLModel):
    id: str
    title: str
    snippet: str
    url: str
    domain: str
    sourceType: SourceEnum
    bias: BiasEnum
    credScore: int
    publishedAt: Optional[datetime]
    confidence: float
    score: float
    scoreBreakdown: ScoreBreakdown


class SearchResponse(SQLModel):
    results: list[SearchResult]
    facets: dict
    meta: dict


class DomainListResponse(SQLModel):
    items: list[Domain]


class DomainResponse(SQLModel):
    domain: Domain


class HealthResponse(SQLModel):
    status: str
    uptime: float
    version: str
    corpusSize: int
    domains: int
