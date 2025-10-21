import shutil

from kg.model import KG_ARTIFACTS, KnowledgeGraph
from kg.provenance import capture_event


def reset():
    if KG_ARTIFACTS.exists():
        shutil.rmtree(KG_ARTIFACTS)


def test_nodes_edges_emitted():
    reset()
    capture_event({"type": "task", "id": "T1", "goal": "demo"})
    capture_event({"type": "artifact", "task_id": "T1", "bot": "Treasury-BOT", "path": "p1"})
    kg = KnowledgeGraph()
    assert kg.find("Task", {"goal": "demo"}) == ["T1"]
    artifact_id = next(n for n, d in kg.nodes.items() if d["label"] == "Artifact")
    assert "Treasury-BOT" in kg.neighbors(artifact_id, "PRODUCED_BY")
    assert "T1" in kg.neighbors(artifact_id, "DERIVED_FROM")
