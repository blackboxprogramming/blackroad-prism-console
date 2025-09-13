from bots import BOT_REGISTRY
from orchestrator.orchestrator import Orchestrator
from orchestrator.protocols import Task


def test_orchestrator_routing(tmp_path):
    orch = Orchestrator(base_path=tmp_path, bots=BOT_REGISTRY)
    task = Task(id="T1", goal="test", context={})
    response = orch.route(task, "Treasury-BOT")
    assert "stub" not in response.summary.lower()
    log_file = tmp_path / "memory.jsonl"
    assert log_file.exists()
    artifact = tmp_path / "artifacts" / "T1" / "response.json"
    assert artifact.exists()
