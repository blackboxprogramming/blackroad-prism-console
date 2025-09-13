from bots.finance import FinanceBot
from orchestrator.orchestrator import Orchestrator


def test_routing_finance_bot(tmp_path):
    mem = tmp_path / "mem.jsonl"
    orch = Orchestrator(memory_path=mem)
    orch.register_bot("finance", FinanceBot())
    task = orch.create_task("Review treasury position", "finance")
    response = orch.route(task.id)
    assert response.status == "success"
    assert "treasury" in response.data.lower()
