from datetime import datetime

from finance import costing
from orchestrator import orchestrator
from orchestrator.protocols import Task


def test_cost_logged(tmp_path, monkeypatch):
    monkeypatch.setattr(costing, "LEDGER", tmp_path / "ledger.jsonl")
    task = Task(id="T1", goal="pm", context=None, created_at=datetime.utcnow())
    orchestrator.route(task, "SRE-BOT")
    report = costing.report()
    assert "SRE-BOT" in report and report["SRE-BOT"] > 0
