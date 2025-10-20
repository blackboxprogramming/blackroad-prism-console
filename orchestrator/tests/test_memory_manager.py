from __future__ import annotations

from pathlib import Path

import pytest

from orchestrator.memory_manager import (
    LongTermMemory,
    MemoryConfig,
    MemoryManager,
    MemoryOperationError,
    ShortTermMemory,
    WorkingMemory,
)


def config_path() -> Path:
    return Path(__file__).resolve().parents[2] / "agents" / "memory" / "memory.yaml"


def test_memory_manager_promote_and_demote() -> None:
    manager = MemoryManager.from_yaml(config_path())
    manager.reset()

    manager.start_turn({"task_id": "t1", "goal": "demo"})
    state = manager.hydrate_state()
    assert state["short_term"], "expected short-term memory to contain the ingested turn"

    manager.record_task_result(goal="demo", constraints=["stay safe"], artifacts=["artifact.md"])
    working = manager.hydrate_state()["working_memory"]
    assert working["goal"] == "demo"
    assert working["artifacts"] == ["artifact.md"]

    manager.apply_op({"op": "promote_to_long_term", "data": {"key": "routes.guardian", "value": "policy"}})
    promoted = manager.hydrate_state()["long_term"]
    assert promoted["routes"]["guardian"] == "policy"

    manager.apply_op({"op": "demote_to_working", "data": {"key": "routes.guardian"}})
    demoted_working = manager.hydrate_state()["working_memory"]
    assert demoted_working.get("routes.guardian") == "policy"

    manager.apply_op({"op": "purge_short_term"})
    assert not manager.hydrate_state()["short_term"]


def test_memory_manager_rejects_unknown_operation() -> None:
    manager = MemoryManager.from_yaml(config_path())
    with pytest.raises(MemoryOperationError):
        manager.apply_op({"op": "unknown"})


def test_short_term_memory_purges_after_ttl() -> None:
    config = MemoryConfig(
        short_term=ShortTermMemory(ttl_turns=2, purpose="test"),
        working=WorkingMemory(keys=()),
        long_term=LongTermMemory(schema=()),
    )
    manager = MemoryManager(config)

    for turn in range(1, 5):
        manager.start_turn({"turn": turn})

    short_term = manager.hydrate_state()["short_term"]
    assert short_term == [{"turn": 4}]
