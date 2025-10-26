from __future__ import annotations

import time
from collections import Counter
from typing import Optional

from dateutil import parser as date_parser
from fastapi import APIRouter, Depends, HTTPException, Request, status

from ..config import Settings, get_settings
from ..models import BiasEnum, FacetCounts, SearchResponse, SearchResult, SourceTypeEnum
from ..observability import metrics
from ..observability.logging import get_logger
from ..ranking.scoring import scale_confidence, score_document, to_breakdown
from ..ranking.tfidf import compute_idf, compute_tfidf, cosine_similarity
from ..repo import RoadviewRepository
from ..services.tokenizer import Tokenizer

router = APIRouter()


def get_repository(request: Request) -> RoadviewRepository:
    return request.app.state.repository


def get_tokenizer(request: Request) -> Tokenizer:
    return request.app.state.tokenizer


@router.get("/api/search", response_model=SearchResponse)
async def search_endpoint(
    request: Request,
    q: str,
    sourceType: Optional[str] = None,
    bias: Optional[str] = None,
    minCred: Optional[int] = None,
    from_: Optional[str] = None,
    to: Optional[str] = None,
    sort: str = "relevance",
    page: int = 1,
    pageSize: int = 25,
    repo: RoadviewRepository = Depends(get_repository),
    tokenizer: Tokenizer = Depends(get_tokenizer),
    settings: Settings = Depends(get_settings),
) -> SearchResponse:
    if not q.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query required")

    start = time.perf_counter()
    logger = get_logger(route="/api/search", request_id=getattr(request.state, "request_id", None))
    query_tokens = tokenizer.tokenize(q)

    from_date = _safe_parse_date(from_)
    to_date = _safe_parse_date(to)

    try:
        source_enum = SourceTypeEnum(sourceType) if sourceType else None
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid sourceType") from exc
    try:
        bias_enum = BiasEnum(bias) if bias else None
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid bias") from exc

    documents = await repo.query_documents(
        source_type=source_enum,
        bias=bias_enum,
        min_cred=minCred,
        from_date=from_date,
        to_date=to_date,
    )

    limited_documents = documents[:5000]
    doc_tokens = [doc.tokens.split() for doc, _domain in limited_documents]
    idf = compute_idf(doc_tokens)
    query_vector = compute_tfidf(query_tokens, idf)

    weights = {
        "text": settings.weight_text,
        "domain": settings.weight_domain,
        "recency": settings.weight_recency,
        "structure": settings.weight_structure,
    }

    scored_documents = []
    for document, domain in limited_documents:
        doc_vector = compute_tfidf(document.tokens.split(), idf)
        similarity = cosine_similarity(query_vector, doc_vector)
        scored = score_document(
            document=document,
            domain=domain,
            text_similarity=similarity,
            weights=weights,
            query_tokens=query_tokens,
        )
        scored_documents.append(scored)

    sort_key = {
        "relevance": lambda item: item.total,
        "credibility": lambda item: item.domain.baseCred,
        "domain": lambda item: item.domain.name.lower(),
        "recency": lambda item: item.document.publishedAt.timestamp() if item.document.publishedAt else 0,
    }.get(sort, lambda item: item.total)

    reverse = sort != "domain"
    scored_documents = sorted(scored_documents, key=sort_key, reverse=reverse)

    scores = [item.total for item in scored_documents]

    total_results = len(scored_documents)
    start_idx = max(page - 1, 0) * pageSize
    end_idx = start_idx + pageSize
    paginated = scored_documents[start_idx:end_idx]

    paginated_scores = scores[start_idx:end_idx]
    paginated_conf = scale_confidence(paginated_scores) if paginated else []

    results: list[SearchResult] = []
    for idx, scored in enumerate(paginated):
        confidence = paginated_conf[idx] if paginated_conf else 1.0
        breakdown = to_breakdown(scored)
        results.append(
            SearchResult(
                id=scored.document.id,
                title=scored.document.title,
                snippet=scored.document.snippet or scored.document.content[:200],
                url=scored.document.url,
                domain=scored.domain.name,
                sourceType=scored.document.sourceType,
                bias=scored.document.bias,
                credScore=scored.document.credScore,
                publishedAt=scored.document.publishedAt,
                confidence=confidence,
                score=scored.total,
                scoreBreakdown=breakdown,
            )
        )

    facets = _build_facets(limited_documents)

    took_ms = (time.perf_counter() - start) * 1000
    metrics.REQUEST_DURATION.observe(took_ms / 1000)
    metrics.REQUESTS_TOTAL.labels(status="ok").inc()

    logger.info(
        "search.completed",
        took_ms=took_ms,
        q_len=len(q),
        results=len(results),
        filters={
            "sourceType": sourceType,
            "bias": bias,
            "minCred": minCred,
            "from": from_,
            "to": to,
            "sort": sort,
            "page": page,
            "pageSize": pageSize,
        },
    )

    return SearchResponse(
        results=results,
        facets=facets,
        meta={"tookMs": round(took_ms, 2), "total": total_results, "page": page, "pageSize": pageSize},
    )


def _build_facets(documents: list[tuple]) -> FacetCounts:
    source_counter: Counter[str] = Counter()
    bias_counter: Counter[str] = Counter()
    domain_counter: Counter[str] = Counter()
    for document, domain in documents:
        source_counter[document.sourceType.value] += 1
        bias_counter[document.bias.value] += 1
        domain_counter[domain.name] += 1
    return FacetCounts(
        sourceType=dict(source_counter),
        bias=dict(bias_counter),
        domains=dict(domain_counter),
    )


def _safe_parse_date(date_str: Optional[str]):
    if not date_str:
        return None
    try:
        return date_parser.parse(date_str)
    except (ValueError, TypeError, OverflowError):
        return None
