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


def test_state_persistence_across_instances(tmp_path):
    memory_path = tmp_path / "memory.jsonl"
    state_path = tmp_path / "orch_state.json"

    first = Orchestrator(memory_path=memory_path, state_path=state_path)
    first.register_bot("finance", FinanceBot())
    created = first.create_task("Check liquidity", "finance")
    first.route(created.id)

    # Recreate orchestrator using the same storage paths to ensure state loads.
    second = Orchestrator(memory_path=memory_path, state_path=state_path)
    second.register_bot("finance", FinanceBot())

    assert created.id in {task.id for task in second.list_tasks()}
    restored = second.get_status(created.id)
    assert restored is not None
    assert restored.status == "success"
