from datetime import datetime, timedelta

from roadview.config import get_settings
from roadview.ranking.scoring import (
    RankedDocument,
    bias_recency_adjustment,
    normalize_confidence,
    penalty_score,
    recency_score,
    structure_score,
)


def test_recency_score_recent():
    now = datetime.utcnow()
    assert recency_score(now - timedelta(days=10), today=now) > recency_score(now - timedelta(days=400), today=now)


def test_structure_score_weights():
    assert structure_score(True, True, False) == 0.75


def test_penalty_score_applies_old_and_short():
    now = datetime.utcnow()
    penalty = penalty_score(now - timedelta(days=365 * 6), 100, today=now)
    assert penalty <= -0.15


def test_bias_recency_adjustment_bounds():
    adjustment = bias_recency_adjustment(["left", "policy"], "left")
    settings = get_settings()
    assert 0 < adjustment <= settings.weight_recency / 2


def test_confidence_normalization():
    confidences = normalize_confidence([0.2, 0.6, 0.6])
    assert confidences[0] == 0.0
    assert confidences[1] == 1.0


def test_ranked_document_breakdown_sums():
    doc = RankedDocument(
        id="1",
        title="Test",
        snippet="Snippet",
        url="https://example.com",
        domain="example.com",
        source_type="news",
        bias="center",
        published_at=datetime.utcnow(),
        cred_score=80,
        text_score=0.5,
        domain_score=0.8,
        recency_score=0.9,
        structure_score=0.5,
        penalty=-0.1,
    )
    breakdown = doc.breakdown()
    total = breakdown.text + breakdown.domain + breakdown.recency + breakdown.structure + breakdown.penalty
    assert abs(total - doc.total_score) < 1e-6
