from __future__ import annotations

from pathlib import Path

import torch

from alice_lucidia.agents.alice import AliceAgent
from alice_lucidia.agents.tools import build_default_tools
from alice_lucidia.memory.store import MemoryStore


def test_alice_plan_selects_retrieval(tmp_path: Path) -> None:
    store = MemoryStore(dim=16, path=tmp_path / "mem.json")
    tools = build_default_tools(store)
    alice = AliceAgent(tools)
    plan = alice.plan("Provide sources on climate change")
    assert any(step.tool == "retrieve" for step in plan)


def test_generation_uses_steering(tmp_path: Path) -> None:
    store = MemoryStore(dim=16, path=tmp_path / "mem.json")
    tools = build_default_tools(store)
    alice = AliceAgent(tools)
    steer = torch.ones(1)
    alice.set_generation_steer(steer)
    result = alice.execute("Draft a summary")
    assert "Draft answer" in result.outputs
