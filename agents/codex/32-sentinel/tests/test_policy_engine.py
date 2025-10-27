"""Tests for the Sentinel policy engine."""

from __future__ import annotations

from agents.codex._32_sentinel.runtime.policy_engine import PolicyEngine


def test_network_policy_allows_known_endpoint() -> None:
    engine = PolicyEngine()
    decision = engine.evaluate({"type": "network", "destination": "api.blackroad.local", "port": 443})
    assert decision.allow, decision.reason


def test_network_policy_blocks_unknown_port() -> None:
    engine = PolicyEngine()
    decision = engine.evaluate({"type": "network", "destination": "api.blackroad.local", "port": 80})
    assert not decision.allow
    assert "not allow-listed" in (decision.reason or "")


def test_fs_policy_blocks_root_access(tmp_path) -> None:
    target = tmp_path / "sentinel" / "allowed.txt"
    target.parent.mkdir()
    target.write_text("ok")
    engine = PolicyEngine()
    decision = engine.evaluate({"type": "fs", "path": str(target), "operation": "write"})
    assert decision.allow
    root_decision = engine.evaluate({"type": "fs", "path": "/root/.ssh/id_rsa", "operation": "read"})
    assert not root_decision.allow


def test_secret_policy_limits_ttl() -> None:
    engine = PolicyEngine()
    ok = engine.evaluate({"type": "secret", "scope": "deploy", "ttl": 900})
    assert ok.allow
    too_long = engine.evaluate({"type": "secret", "scope": "deploy", "ttl": 7200})
    assert not too_long.allow
