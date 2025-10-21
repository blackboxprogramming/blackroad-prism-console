import shutil

from kg.model import KG_ARTIFACTS
from kg.provenance import capture_event
from kg.query import run as kql_run


def reset():
    if KG_ARTIFACTS.exists():
        shutil.rmtree(KG_ARTIFACTS)


def build_sample():
    capture_event({"type": "task", "id": "T1", "goal": "demo"})
    capture_event(
        {
            "type": "artifact",
            "id": "A0001",
            "task_id": "T1",
            "bot": "Treasury-BOT",
            "path": "p1",
            "artifact_type": "response",
            "date": "2025-07-02",
        }
    )
    capture_event(
        {
            "type": "artifact",
            "id": "A0002",
            "task_id": "T1",
            "bot": "Treasury-BOT",
            "path": "p2",
            "artifact_type": "response",
            "date": "2025-07-03",
        }
    )
    capture_event({"type": "decision", "id": "D1", "artifact_id": "A0002", "risk": "high"})


def test_filters_and_limit():
    reset()
    build_sample()
    q = (
        'MATCH (a:Artifact)-[:PRODUCED_BY]->(b:Bot[name="Treasury-BOT"]) '
        'WHERE a.date>="2025-07-02" RETURN a.path, b.name LIMIT 2'
    )
    res = kql_run(q)
    assert res[0]["a.path"] == "p1"
    assert len(res) == 2


def test_not_exists():
    reset()
    build_sample()
    q = (
        "MATCH (d:Decision)-[:DERIVED_FROM]->(a:Artifact) "
        'WHERE d.risk>="high" AND NOT EXISTS(d.review_id) RETURN d.id'
    )
    res = kql_run(q)
    assert res == [{"d.id": "D1"}]
