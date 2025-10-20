import pytest
from tools import artifacts


@pytest.mark.parametrize(
    "table,record",
    [
        ("audience_segments", {"segment": "s", "contact_id": "C1"}),
        ("lead_scores", {"contact_id": "C1", "score": 1, "bucket": "A"}),
        ("attribution", {"contact_id": "C1", "model": "linear", "channel": "google", "credit": 1}),
        ("seo_issues", {"file": "a", "code": "SEO_NO_H1"}),
        ("social_posts", {"id": "P1", "channel": "x", "text": "t", "scheduled_at": "2025-01-01", "status": "queued"}),
        (
            "content_calendar",
            {"id": "CAL0001", "title": "t", "type": "blog", "due": "2025-01-01", "owner": "o", "status": "planned"},
        ),
    ],
)
def test_contract_valid(table, record, tmp_path):
    path = tmp_path / f"{table}.jsonl"
    schema = f"contracts/schemas/{table}.schema.json"
    artifacts.validate_and_write(str(path), record, schema)


@pytest.mark.parametrize(
    "table,record",
    [
        ("audience_segments", {"segment": "s"}),
        ("lead_scores", {"contact_id": "C1"}),
    ],
)
def test_contract_invalid(table, record, tmp_path):
    path = tmp_path / "x.jsonl"
    schema = f"contracts/schemas/{table}.schema.json"
    with pytest.raises(Exception):
        artifacts.validate_and_write(str(path), record, schema)
