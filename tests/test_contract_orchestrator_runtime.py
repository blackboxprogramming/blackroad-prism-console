from __future__ import annotations

from pathlib import Path

import pytest

from orchestrator.contract_runtime import build_orchestrator
from orchestrator.simple_orchestrator import ContractValidationError


@pytest.fixture()
def contracts_path() -> Path:
    return Path(__file__).resolve().parents[1] / "contracts" / "agents"


@pytest.fixture()
def stubbed_orchestrator(monkeypatch, contracts_path: Path):
    calls = {"cleanup": 0, "build": 0, "deploy": 0}

    class StubCleanup:
        def __init__(self, branches, dry_run):
            self.branches = branches or ["auto"]
            self.dry_run = dry_run

        @classmethod
        def from_merged(cls, base: str = "main", dry_run: bool = False):
            return cls(branches=["auto"], dry_run=dry_run)

        def cleanup(self):
            calls["cleanup"] += 1
            return {branch: True for branch in self.branches}

    class StubWebsiteBot:
        def __init__(self, deploy_cmd):
            self.deploy_cmd = deploy_cmd

        def deploy(self):
            calls["deploy"] += 1

        def purge_cache(self):
            calls.setdefault("purge", 0)
            calls["purge"] += 1

        def warm_cache(self):
            calls.setdefault("warm", 0)
            calls["warm"] += 1

    monkeypatch.setattr("orchestrator.executors.CleanupBot", StubCleanup)
    monkeypatch.setattr("orchestrator.executors.WebsiteBot", StubWebsiteBot)

    def fake_build_site() -> int:
        calls["build"] += 1
        return 0

    monkeypatch.setattr("orchestrator.executors.build_site", fake_build_site)

    orchestrator = build_orchestrator(contracts_path)
    return orchestrator, calls


def test_plan_execution_updates_context(stubbed_orchestrator):
    orchestrator, calls = stubbed_orchestrator
    context = {
        "branches": ["feature/x"],
        "dry_run": False,
        "purge_cache": False,
        "warm_cache": False,
    }

    result = orchestrator.run_plan(
        ["cleanup_report", "build_exit_code", "deployment_summary"], context
    )

    assert result["cleanup_report"] == {"feature/x": True}
    assert result["build_exit_code"] == 0
    assert result["deployment_summary"]["deployed"] is True
    assert calls["cleanup"] == 1
    assert calls["deploy"] == 1


def test_output_validation_failure(monkeypatch, contracts_path: Path):
    orchestrator = build_orchestrator(contracts_path)

    def bad_cleanup(_context):
        return {"cleanup_report": "not a dict"}

    orchestrator._registry.register_executor("cleanup_git_branches", bad_cleanup)

    with pytest.raises(ContractValidationError):
        orchestrator.run_plan(["cleanup_report"], {})
