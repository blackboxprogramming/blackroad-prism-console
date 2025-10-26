from datetime import datetime, timedelta, timezone

import pytest

from roadview.models import BiasEnum, Domain, Document
from roadview.ranking.scoring import (
    BIAS_KEYWORDS,
    apply_bias_normalizer,
    scale_confidence,
    score_document,
    to_breakdown,
)


def _build_document(**overrides):
    defaults = dict(
        id="doc-1",
        title="Sample",
        snippet="",
        url="https://example.com/sample",
        domain="example.com",
        sourceType="news",
        bias="center",
        credScore=80,
        publishedAt=datetime.now(timezone.utc) - timedelta(days=30),
        content="content",
        author="author",
        hasCanonical=True,
        hasAuthor=True,
        hasDate=True,
        tokens="word " * 500,
    )
    defaults.update(overrides)
    return Document(**defaults)


def test_score_breakdown_matches_total():
    document = _build_document()
    domain = Domain(name="example.com", baseCred=80, bias=BiasEnum.center)
    weights = {"text": 0.55, "domain": 0.25, "recency": 0.15, "structure": 0.05}
    scored = score_document(
        document=document,
        domain=domain,
        text_similarity=0.8,
        weights=weights,
        query_tokens=["policy"],
    )
    breakdown = to_breakdown(scored)
    reconstructed = (
        breakdown.text + breakdown.domain + breakdown.recency + breakdown.structure + breakdown.penalty
    )
    assert abs(reconstructed - scored.total) < 1e-6


def test_confidence_scaling_handles_identical_scores():
    confidences = scale_confidence([0.5, 0.5])
    assert confidences == [1.0, 1.0]


def test_bias_normalizer_increases_recency_for_ideological_query():
    base = 0.5
    boosted = apply_bias_normalizer([next(iter(BIAS_KEYWORDS))], "left", base)
    assert boosted >= base
    assert pytest.approx(0.02, abs=1e-6) == boosted - base
