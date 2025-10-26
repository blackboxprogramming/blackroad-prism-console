from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class BiasEnum(str, Enum):
    left = "left"
    center = "center"
    right = "right"
    na = "na"


class SourceTypeEnum(str, Enum):
    journal = "journal"
    news = "news"
    blog = "blog"
    paper = "paper"
    gov = "gov"
    repo = "repo"


class DomainPolicyEnum(str, Enum):
    allow = "allow"
    noindex = "noindex"
    block = "block"


class SortOptionEnum(str, Enum):
    recency = "recency"
    credibility = "credibility"
    domain = "domain"
    relevance = "relevance"


class Domain(SQLModel, table=True):
    name: str = Field(primary_key=True, index=True)
    displayName: Optional[str] = None
    bias: BiasEnum = Field(default=BiasEnum.na)
    baseCred: int = Field(default=60, ge=0, le=100)
    policy: DomainPolicyEnum = Field(default=DomainPolicyEnum.allow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class Document(SQLModel, table=True):
    id: str = Field(primary_key=True)
    title: str
    snippet: Optional[str] = None
    url: str
    domain: str = Field(foreign_key="domain.name")
    sourceType: SourceTypeEnum
    bias: BiasEnum = Field(default=BiasEnum.na)
    credScore: int = Field(default=0, ge=0, le=100)
    publishedAt: Optional[datetime] = None
    content: str
    author: Optional[str] = None
    hasCanonical: bool = Field(default=False)
    hasAuthor: bool = Field(default=False)
    hasDate: bool = Field(default=False)
    tokens: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class IndexRequestDocument(SQLModel):
    title: str
    url: str
    domain: Optional[str] = None
    sourceType: SourceTypeEnum
    bias: BiasEnum = BiasEnum.na
    publishedAt: Optional[str] = None
    content: str
    author: Optional[str] = None
    hasCanonical: Optional[bool] = None


class DomainUpsert(SQLModel):
    name: str
    displayName: Optional[str] = None
    bias: BiasEnum = BiasEnum.na
    baseCred: int = 60
    policy: DomainPolicyEnum = DomainPolicyEnum.allow


class DomainResponse(SQLModel):
    domain: Domain


class BulkIndexResponse(SQLModel):
    indexed: int


class SearchFilters(SQLModel):
    q: str
    sourceType: Optional[SourceTypeEnum] = None
    bias: Optional[BiasEnum] = None
    minCred: Optional[int] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    sort: SortOptionEnum = SortOptionEnum.relevance
    page: int = 1
    pageSize: int = 25


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
    sourceType: SourceTypeEnum
    bias: BiasEnum
    credScore: int
    publishedAt: Optional[datetime]
    confidence: float
    score: float
    scoreBreakdown: ScoreBreakdown


class FacetCounts(SQLModel):
    sourceType: dict[str, int]
    bias: dict[str, int]
    domains: dict[str, int]


class SearchResponse(SQLModel):
    results: list[SearchResult]
    facets: FacetCounts
    meta: dict[str, float | int]
