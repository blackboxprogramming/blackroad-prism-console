from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, List

from ..config import get_bias_normalization, get_settings
from ..models import BiasEnum, ScoreBreakdown

settings = get_settings()
bias_normalization = get_bias_normalization()


@dataclass
class RankedDocument:
    id: str
    title: str
    snippet: str
    url: str
    domain: str
    source_type: str
    bias: str
    published_at: datetime | None
    cred_score: int
    text_score: float
    domain_score: float
    recency_score: float
    structure_score: float
    penalty: float

    @property
    def total_score(self) -> float:
        return (
            settings.weight_text * self.text_score
            + settings.weight_domain * self.domain_score
            + settings.weight_recency * self.recency_score
            + settings.weight_structure * self.structure_score
            + self.penalty
        )

    def breakdown(self) -> ScoreBreakdown:
        return ScoreBreakdown(
            text=settings.weight_text * self.text_score,
            domain=settings.weight_domain * self.domain_score,
            recency=settings.weight_recency * self.recency_score,
            structure=settings.weight_structure * self.structure_score,
            penalty=self.penalty,
        )


def recency_score(published_at: datetime | None, *, today: datetime | None = None) -> float:
    if not published_at:
        return 0.2
    base = today or datetime.utcnow()
    delta_days = max((base - published_at).days, 0)
    return float(pow(2.718281828459045, -delta_days / 365))


def structure_score(has_author: bool, has_date: bool, has_canonical: bool) -> float:
    return 0.25 * float(has_author) + 0.5 * float(has_date) + 0.25 * float(has_canonical)


def penalty_score(published_at: datetime | None, token_count: int, *, today: datetime | None = None) -> float:
    penalty = 0.0
    if published_at:
        base = today or datetime.utcnow()
        if (base - published_at).days > 365 * 5:
            penalty -= 0.15
    if token_count < 400:
        penalty -= 0.1
    return penalty


def bias_recency_adjustment(query_tokens: Iterable[str], doc_bias: BiasEnum | str) -> float:
    bias_value = str(doc_bias)
    if bias_value == BiasEnum.na.value:
        return 0.0
    tokens = {token.lower() for token in query_tokens}
    if any(keyword in tokens for keyword in bias_normalization.keywords):
        return min(bias_normalization.recency_bonus, settings.weight_recency / 2)
    return 0.0


def normalize_confidence(scores: List[float]) -> List[float]:
    if not scores:
        return []
    minimum = min(scores)
    maximum = max(scores)
    if maximum == minimum:
        return [1.0 for _ in scores]
    return [(score - minimum) / (maximum - minimum) for score in scores]
