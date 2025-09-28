import pytest

import scripts.blackroad_ci as ci


def test_run_tests_invokes_both_suites(monkeypatch: pytest.MonkeyPatch) -> None:
    commands: list[str] = []
    monkeypatch.setattr(ci, "run", lambda cmd: commands.append(cmd))

    ci.run_tests()

    assert commands == ["npm test -- --watch=false", "pytest -q"]


def test_handle_push_runs_tests_first(monkeypatch: pytest.MonkeyPatch) -> None:
    order: list[str] = []
    monkeypatch.setattr(ci, "run_tests", lambda: order.append("tests"))
    monkeypatch.setattr(ci, "push_latest", lambda: order.append("push"))
    monkeypatch.setattr(ci, "deploy_to_droplet", lambda: order.append("deploy"))

    ci.handle_command("please push the latest changes")

    assert order == ["tests", "push", "deploy"]


def test_handle_git_commands(monkeypatch: pytest.MonkeyPatch) -> None:
    status_called = []
    log_called = []
    monkeypatch.setattr(ci, "git_status", lambda: status_called.append(True))
    monkeypatch.setattr(ci, "git_recent_log", lambda limit=5: log_called.append(limit))

    ci.handle_command("git status please")
    ci.handle_command("git log latest")

    assert status_called == [True]
    assert log_called == [5]


def test_sync_linear(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[str] = []

    class DummyLinear(ci.LinearConnector):
        def __init__(self, token: str | None) -> None:
            calls.append(token or "")

        def sync(self) -> None:  # pragma: no cover - simple recorder
            calls.append("sync")

    monkeypatch.setenv("LINEAR_TOKEN", "linear-token")
    monkeypatch.setattr(ci, "LinearConnector", DummyLinear)

    ci.sync_linear()

    assert calls == ["linear-token", "sync"]


def test_handle_linear_command(monkeypatch: pytest.MonkeyPatch) -> None:
    called: list[str] = []
    monkeypatch.setattr(ci, "sync_linear", lambda: called.append("linear"))

    ci.handle_command("sync linear roadmap")

    assert called == ["linear"]
