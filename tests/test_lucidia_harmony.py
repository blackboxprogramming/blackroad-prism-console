from __future__ import annotations

import json
from pathlib import Path

from lucidia.harmony import HarmonyCoordinator


def read_state(path: Path) -> dict[str, object]:
    return json.loads(path.read_text())


def test_ping_remote_records_handshake(tmp_path: Path) -> None:
    ledger = tmp_path / "ledger.json"
    coordinator = HarmonyCoordinator(
        "lucidia",
        role="hologram-console",
        status="booting",
        capabilities=["repl"],
        channels=["hologram"],
        ledger_path=ledger,
    )
    coordinator.update_local_status(
        role="hologram-console",
        status="ready",
        capabilities=["repl"],
        channels=["hologram"],
        metadata={"node": "lucidia"},
    )

    handshake = coordinator.ping_remote(
        "alice",
        intent="sync",
        channel="hologram-console",
        payload={"mode": "cooperative"},
    )

    assert handshake["to"] == "alice"
    assert handshake["payload"] == {"mode": "cooperative"}

    state = read_state(ledger)
    assert "handshakes" in state
    assert state["handshakes"][-1]["to"] == "alice"
    assert state["nodes"]["lucidia"]["status"] == "ready"
    assert state["nodes"]["lucidia"]["metadata"]["node"] == "lucidia"
    assert state["nodes"]["alice"]["status"] == "unknown"


def test_list_recent_handshakes_returns_newest_first(tmp_path: Path) -> None:
    ledger = tmp_path / "ledger.json"
    coordinator = HarmonyCoordinator(
        "lucidia",
        role="hologram-console",
        status="booting",
        capabilities=["repl"],
        channels=["hologram"],
        ledger_path=ledger,
    )

    coordinator.ping_remote("alice", intent="calibration")
    coordinator.ping_remote("bob", intent="sync")
    coordinator.ping_remote("carol", intent="status")

    history = coordinator.list_recent_handshakes(limit=2)
    assert [entry["to"] for entry in history] == ["carol", "bob"]


def test_export_state_returns_copy(tmp_path: Path) -> None:
    ledger = tmp_path / "ledger.json"
    coordinator = HarmonyCoordinator(
        "lucidia",
        role="hologram-console",
        status="booting",
        ledger_path=ledger,
    )
    state = coordinator.export_state()
    state["nodes"]["lucidia"]["status"] = "mutated"

    refreshed = coordinator.export_state()
    assert refreshed["nodes"]["lucidia"]["status"] != "mutated"
