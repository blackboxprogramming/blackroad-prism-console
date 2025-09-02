"""Unit tests for the minimal Codex deployment pipeline.

The suite simulates failures in each pipeline stage and asserts that
rollback or skip behavior occurs as expected.  This keeps coverage focused
on error handling in ``tools.codex_pipeline`` without relying on external
services.
"""

import subprocess

import pytest

import tools.codex_pipeline as cp


class Runner:
    def __init__(self, fail_on: str):
        self.fail_on = fail_on
        self.commands: list[str] = []

    def __call__(self, cmd: str) -> None:
        self.commands.append(cmd)
        if self.fail_on in cmd:
            raise subprocess.CalledProcessError(1, cmd)


def test_git_failure(monkeypatch):
    runner = Runner("git push")
    monkeypatch.setattr(cp, "run", runner)
    monkeypatch.setattr(cp, "log_error", lambda *a, **k: None)
    with pytest.raises(subprocess.CalledProcessError):
        cp.run_pipeline()
    assert any("git reset --hard" in c for c in runner.commands)


def test_connector_failure(monkeypatch):
    runner = Runner("connector-sync")
    monkeypatch.setattr(cp, "run", runner)
    monkeypatch.setattr(cp, "log_error", lambda *a, **k: None)
    with pytest.raises(subprocess.CalledProcessError):
        cp.run_pipeline()
    assert "validate-services" not in "".join(runner.commands)
    assert not any("/var/backups/blackroad" in c for c in runner.commands)


def test_droplet_copy_failure(monkeypatch):
    runner = Runner("deploy-to-droplet")
    monkeypatch.setattr(cp, "run", runner)
    monkeypatch.setattr(cp, "log_error", lambda *a, **k: None)
    with pytest.raises(subprocess.CalledProcessError):
        cp.run_pipeline()
    assert any("/var/backups/blackroad/droplet" in c for c in runner.commands)


def test_validation_failure_triggers_rollback(monkeypatch):
    runner = Runner("validate-services")
    monkeypatch.setattr(cp, "run", runner)
    logs: list[tuple[str, bool]] = []
    monkeypatch.setattr(
        cp, "log_error", lambda stage, exc, rollback, webhook=None: logs.append((stage, rollback))
    )
    with pytest.raises(subprocess.CalledProcessError):
        cp.run_pipeline()
    assert any("/var/backups/blackroad/latest" in c for c in runner.commands)
    assert ("validate_services", True) in logs
