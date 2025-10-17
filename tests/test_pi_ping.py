from __future__ import annotations

from typing import Any, Dict

import sys
import types

import pytest
from fastapi.testclient import TestClient


def _install_agent_stub() -> None:
    if "agent" in sys.modules and "agent.config" in sys.modules:
        return
    agent_pkg = types.ModuleType("agent")
    config_mod = types.ModuleType("agent.config")
    store_mod = types.ModuleType("agent.store")
    transcribe_mod = types.ModuleType("agent.transcribe")

    def active_target() -> tuple[str, str]:
        return "jetson.local", "ubuntu"

    def transcript_start(session: str) -> None:  # pragma: no cover - stub
        _TRANSCRIPTS.setdefault(session, [])

    def transcript_append(session: str, line: str) -> None:  # pragma: no cover - stub
        _TRANSCRIPTS.setdefault(session, []).append(line)

    def transcript_finish(session: str) -> None:  # pragma: no cover - stub
        pass

    def transcript_get(session: str) -> dict[str, str] | None:  # pragma: no cover - stub
        if session not in _TRANSCRIPTS:
            return None
        return {"session": session, "lines": _TRANSCRIPTS[session]}

    def allocate_path(name: str) -> "Path":  # pragma: no cover - stub
        from pathlib import Path

        safe = Path(name).name
        if not safe or safe in {"", "."}:
            safe = "upload.bin"
        return (Path.cwd() / "tmp" / safe)

    config_mod.active_target = active_target  # type: ignore[attr-defined]
    store_mod.transcript_start = transcript_start  # type: ignore[attr-defined]
    store_mod.transcript_append = transcript_append  # type: ignore[attr-defined]
    store_mod.transcript_finish = transcript_finish  # type: ignore[attr-defined]
    store_mod.transcript_get = transcript_get  # type: ignore[attr-defined]
    transcribe_mod.TMP_DIR = allocate_path(".").parent  # type: ignore[attr-defined]
    transcribe_mod.allocate_path = allocate_path  # type: ignore[attr-defined]

    agent_pkg.config = config_mod  # type: ignore[attr-defined]
    agent_pkg.store = store_mod  # type: ignore[attr-defined]
    agent_pkg.transcribe = transcribe_mod  # type: ignore[attr-defined]
    sys.modules.setdefault("agent", agent_pkg)
    sys.modules.setdefault("agent.config", config_mod)
    sys.modules.setdefault("agent.store", store_mod)
    sys.modules.setdefault("agent.transcribe", transcribe_mod)


_TRANSCRIPTS: Dict[str, list[str]] = {}


_install_agent_stub()

from pi.api import app  # noqa: E402  (import after stub setup)


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def _success_output(host: str = "jetson.local") -> str:
    return (
        f"PING {host} (192.0.2.1): 56 data bytes\n"
        f"64 bytes from {host}: icmp_seq=0 ttl=64 time=1.23 ms\n\n"
        f"--- {host} ping statistics ---\n"
        "1 packets transmitted, 1 received, 0% packet loss, time 0ms\n"
        "rtt min/avg/max/mdev = 1.23/1.23/1.23/0.00 ms\n"
    )


def _failure_output(host: str = "jetson.local") -> str:
    return (
        f"PING {host} (198.51.100.55): 56 data bytes\n\n"
        f"--- {host} ping statistics ---\n"
        "1 packets transmitted, 0 received, 100% packet loss, time 0ms\n"
    )


def test_ping_endpoint_success(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    calls: Dict[str, Any] = {}

    async def fake_run_ping(host: str) -> tuple[int, str, str]:
        calls["host"] = host
        return 0, _success_output(host), ""

    monkeypatch.setattr("pi.api._run_ping", fake_run_ping)

    resp = client.get("/ping")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["ok"] is True
    assert payload["host"] == "jetson.local"
    assert payload["user"] == "ubuntu"
    assert payload["latency_ms"] == pytest.approx(1.23)
    assert payload["packet_loss_percent"] == pytest.approx(0.0)
    assert payload["packets_transmitted"] == 1
    assert payload["packets_received"] == 1
    assert calls["host"] == "jetson.local"


def test_ping_endpoint_failure(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    async def fake_run_ping(host: str) -> tuple[int, str, str]:
        return 1, _failure_output(host), ""

    monkeypatch.setattr("pi.api._run_ping", fake_run_ping)

    resp = client.get("/ping")
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["ok"] is False
    assert payload["packet_loss_percent"] == pytest.approx(100.0)
    assert payload["packets_transmitted"] == 1
    assert payload["packets_received"] == 0


def test_ping_endpoint_missing_binary(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    async def fake_run_ping(host: str) -> tuple[int, str, str]:  # pragma: no cover - stub
        raise FileNotFoundError("ping")

    monkeypatch.setattr("pi.api._run_ping", fake_run_ping)

    resp = client.get("/ping")
    assert resp.status_code == 500
    assert resp.json()["detail"] == "ping command not available"
