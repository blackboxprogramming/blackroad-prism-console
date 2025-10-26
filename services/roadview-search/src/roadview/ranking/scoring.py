from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, List

from ..models import Domain, Document, ScoreBreakdown

BIAS_KEYWORDS = {
    "left",
    "right",
    "liberal",
    "conservative",
    "progressive",
    "socialist",
    "capitalist",
    "democrat",
    "republican",
    "centrist",
}


@dataclass
class ScoredDocument:
    document: Document
    domain: Domain
    text_score: float
    domain_score: float
    recency_score: float
    structure_score: float
    penalty: float

    @property
    def total(self) -> float:
        return self.text_score + self.domain_score + self.recency_score + self.structure_score + self.penalty


def recency_score(published_at: datetime | None) -> float:
    if not published_at:
        return 0.2
    now = datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    delta = now - published_at
    days = max(delta.days, 0)
    return math.exp(-days / 365)


def structure_score(document: Document) -> float:
    score = 0.0
    score += 0.25 if document.hasAuthor else 0.0
    score += 0.5 if document.hasDate else 0.0
    score += 0.25 if document.hasCanonical else 0.0
    return score


def penalty_score(document: Document, published_at: datetime | None) -> float:
    penalty = 0.0
    if published_at:
        now = datetime.now(timezone.utc)
        if published_at.tzinfo is None:
            published_at = published_at.replace(tzinfo=timezone.utc)
        if (now - published_at).days > 5 * 365:
            penalty -= 0.15
    tokens_count = len(document.tokens.split())
    if tokens_count < 400:
        penalty -= 0.1
    return penalty


def apply_bias_normalizer(query_tokens: Iterable[str], domain_bias: str, recency: float) -> float:
    if domain_bias == "na":
        return recency
    if not any(token in BIAS_KEYWORDS for token in query_tokens):
        return recency
    return min(recency + 0.02, 1.0)


def score_document(
    *,
    document: Document,
    domain: Domain,
    text_similarity: float,
    weights: dict[str, float],
    query_tokens: Iterable[str],
) -> ScoredDocument:
    domain_component = domain.baseCred / 100
    recency_component = recency_score(document.publishedAt)
    recency_component = apply_bias_normalizer(query_tokens, domain.bias.value, recency_component)
    structure_component = structure_score(document)
    penalty_component = penalty_score(document, document.publishedAt)

    scored = ScoredDocument(
        document=document,
        domain=domain,
        text_score=text_similarity * weights["text"],
        domain_score=domain_component * weights["domain"],
        recency_score=recency_component * weights["recency"],
        structure_score=structure_component * weights["structure"],
        penalty=penalty_component,
    )
    return scored


def scale_confidence(scores: List[float]) -> List[float]:
    if not scores:
        return []
    max_score = max(scores)
    min_score = min(scores)
    if math.isclose(max_score, min_score):
        return [1.0 for _ in scores]
    return [(score - min_score) / (max_score - min_score) for score in scores]


def to_breakdown(scored: ScoredDocument) -> ScoreBreakdown:
    return ScoreBreakdown(
        text=scored.text_score,
        domain=scored.domain_score,
        recency=scored.recency_score,
        structure=scored.structure_score,
        penalty=scored.penalty,
    )
