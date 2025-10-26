from __future__ import annotations

import time
from datetime import datetime
from typing import Any, Dict, Iterable, List, Tuple

import structlog
from dateutil import parser
from fastapi import APIRouter, Depends, Query

from ..config import get_settings
from ..models import PolicyEnum, ScoreBreakdown, SearchQuery, SearchResponse, SearchResult
from ..observability.logging import bind_request, log_search
from ..ranking.scoring import (
    RankedDocument,
    bias_recency_adjustment,
    normalize_confidence,
    penalty_score,
    recency_score,
    structure_score,
)
from ..ranking.tfidf import cosine_similarity, query_vector, tfidf
from ..repo import (
    get_session,
    load_documents_with_domains,
    tokens_from_document,
)
from ..services.tokenizer import tokenize

router = APIRouter(tags=["search"])
logger = structlog.get_logger("roadview.search")
settings = get_settings()


async def get_query(
    q: str = Query(..., min_length=1),
    sourceType: str | None = Query(default=None, pattern="^(journal|news|blog|paper|gov|repo)$"),
    bias: str | None = Query(default=None, pattern="^(left|center|right|na)$"),
    minCred: int | None = Query(default=None, ge=0, le=100),
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = Query(default=None),
    sort: str | None = Query(default=None, pattern="^(recency|credibility|domain|relevance)$"),
    page: int = Query(default=1, ge=1),
    pageSize: int | None = Query(default=None, ge=1),
) -> SearchQuery:
    normalized_source = sourceType if sourceType not in {"", "null"} else None
    normalized_bias = bias if bias not in {"", "null"} else None
    return SearchQuery(
        q=q,
        sourceType=normalized_source,  # type: ignore[arg-type]
        bias=normalized_bias,  # type: ignore[arg-type]
        minCred=minCred,
        from_=from_,
        to=to,
        sort=sort,  # type: ignore[arg-type]
        page=page,
        pageSize=pageSize,
    )


def _parse_filter_date(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        dt = parser.parse(raw)
        if dt.tzinfo:
            dt = dt.astimezone(tz=None)
        return dt.replace(tzinfo=None)
    except (ValueError, OverflowError, TypeError):
        return None


def _snippet(content: str) -> str:
    tokens = tokenize(content)
    return " ".join(tokens[:40])


def _facet_counts(items: Iterable[Tuple[Any, Any]]) -> Dict[str, Dict[str, int]]:
    source_counts: Dict[str, int] = {}
    bias_counts: Dict[str, int] = {}
    domain_counts: Dict[str, int] = {}
    for doc, domain in items:
        source_counts[str(doc.sourceType.value)] = source_counts.get(str(doc.sourceType.value), 0) + 1
        bias_counts[str(doc.bias.value)] = bias_counts.get(str(doc.bias.value), 0) + 1
        domain_counts[domain.name] = domain_counts.get(domain.name, 0) + 1
    return {
        "sourceType": source_counts,
        "bias": bias_counts,
        "domains": domain_counts,
    }


def _apply_sort(sort: str | None, ranked: List[RankedDocument]) -> List[RankedDocument]:
    if sort == "recency":
        return sorted(ranked, key=lambda doc: doc.published_at or datetime.min, reverse=True)
    if sort == "credibility":
        return sorted(ranked, key=lambda doc: doc.cred_score, reverse=True)
    if sort == "domain":
        return sorted(ranked, key=lambda doc: doc.domain)
    return sorted(ranked, key=lambda doc: doc.total_score, reverse=True)


@router.get("/search", response_model=SearchResponse)
async def search_endpoint(query: SearchQuery = Depends(get_query)) -> SearchResponse:
    start = time.perf_counter()
    async with get_session() as session:
        raw_docs = await load_documents_with_domains(session)

    from_date = _parse_filter_date(query.from_)
    to_date = _parse_filter_date(query.to)

    filtered: List[Tuple[Any, Any]] = []
    for doc, domain in raw_docs:
        if domain.policy == PolicyEnum.noindex:
            continue
        if query.sourceType and doc.sourceType != query.sourceType:
            continue
        if query.bias and doc.bias != query.bias:
            continue
        if query.minCred is not None and domain.baseCred < query.minCred:
            continue
        if from_date and (doc.publishedAt or datetime.min) < from_date:
            continue
        if to_date and (doc.publishedAt or datetime.max) > to_date:
            continue
        filtered.append((doc, domain))

    if not filtered:
        took = (time.perf_counter() - start) * 1000
        return SearchResponse(
            results=[],
            facets={"sourceType": {}, "bias": {}, "domains": {}},
            meta={
                "tookMs": round(took, 2),
                "total": 0,
                "page": query.page,
                "pageSize": query.pageSize or settings.default_page_size,
            },
        )

    facets = _facet_counts(filtered)

    corpus_tokens = [tokens_from_document(doc) for doc, _ in filtered]
    idf = {}
    if corpus_tokens:
        from ..repo import compute_idf

        idf = compute_idf(corpus_tokens)
    query_vector_data = query_vector(query.q, idf)
    query_tokens = tokenize(query.q)

    ranked_docs: List[RankedDocument] = []
    for doc, domain in filtered:
        doc_tokens = tokens_from_document(doc)
        doc_vector = tfidf(doc_tokens, idf)
        text_similarity = cosine_similarity(query_vector_data, doc_vector)
        domain_score_value = domain.baseCred / 100
        recency_value = recency_score(doc.publishedAt)
        recency_value += bias_recency_adjustment(query_tokens, domain.bias)
        recency_value = min(recency_value, 1.0)
        structure_value = structure_score(doc.hasAuthor, doc.hasDate, doc.hasCanonical)
        penalty_value = penalty_score(doc.publishedAt, len(doc_tokens))
        ranked_docs.append(
            RankedDocument(
                id=doc.id,
                title=doc.title,
                snippet=_snippet(doc.content),
                url=doc.url,
                domain=doc.domain,
                source_type=doc.sourceType,
                bias=doc.bias,
                published_at=doc.publishedAt,
                cred_score=domain.baseCred,
                text_score=text_similarity,
                domain_score=domain_score_value,
                recency_score=recency_value,
                structure_score=structure_value,
                penalty=penalty_value,
            )
        )

    ranked_docs = _apply_sort(query.sort or "relevance", ranked_docs)
    total = len(ranked_docs)

    page_size = query.pageSize or settings.default_page_size
    page_size = min(page_size, settings.max_page_size)
    start_index = (query.page - 1) * page_size
    end_index = start_index + page_size
    page_docs = ranked_docs[start_index:end_index]

    scores = [doc.total_score for doc in page_docs]
    confidences = normalize_confidence(scores)

    results_payload: List[SearchResult] = []
    for doc, confidence in zip(page_docs, confidences):
        breakdown = doc.breakdown()
        results_payload.append(
            SearchResult(
                id=doc.id,
                title=doc.title,
                snippet=doc.snippet,
                url=doc.url,
                domain=doc.domain,
                sourceType=doc.source_type,  # type: ignore[arg-type]
                bias=doc.bias,  # type: ignore[arg-type]
                credScore=doc.cred_score,
                publishedAt=doc.published_at,
                confidence=confidence,
                score=doc.total_score,
                scoreBreakdown=ScoreBreakdown(**breakdown.model_dump()),
            )
        )

    took = (time.perf_counter() - start) * 1000
    log_search(
        bind_request(
            logger,
            q=query.q,
            filters={
                "sourceType": query.sourceType,
                "bias": query.bias,
                "minCred": query.minCred,
                "from": query.from_,
                "to": query.to,
                "sort": query.sort,
            },
        ),
        {
            "took_ms": round(took, 2),
            "results": len(results_payload),
            "total": total,
        },
    )

    return SearchResponse(
        results=results_payload,
        facets=facets,
        meta={
            "tookMs": round(took, 2),
            "total": total,
            "page": query.page,
            "pageSize": page_size,
        },
    )
