import json

import pytest

from bots.finance import FinanceBot
from orchestrator.orchestrator import Orchestrator
from tools import web_search


def test_web_search_disabled():
    with pytest.raises(NotImplementedError):
        web_search.search("test")


def test_logging(tmp_path):
    mem = tmp_path / "mem.jsonl"
    orch = Orchestrator(memory_path=mem)
    orch.register_bot("finance", FinanceBot())
    task = orch.create_task("Check treasury", "finance")
    orch.route(task.id)
    logs = [json.loads(line) for line in mem.read_text().splitlines()]
    events = {entry["event"] for entry in logs}
    assert {"task_created", "task_routed"} <= events
