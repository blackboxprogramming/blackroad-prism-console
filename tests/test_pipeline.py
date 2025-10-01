import os
import subprocess
from unittest import mock

from tools import codex_pipeline


def test_sync_to_working_copy(monkeypatch):
    """Ensure sync pushes and triggers Working Copy hooks."""
    cp = subprocess.CompletedProcess(args=[], returncode=0, stdout="origin\nworking-copy\n")

    def fake_run(cmd, capture_output=False, text=False, check=False):
        assert cmd == ["git", "-C", ".", "remote"]
        return cp

    monkeypatch.setattr(codex_pipeline.subprocess, "run", fake_run)

    run_calls = []
    monkeypatch.setattr(codex_pipeline, "run", lambda cmd, dry_run=False: run_calls.append(cmd))

    browser = mock.Mock(return_value=True)
    monkeypatch.setattr(codex_pipeline.webbrowser, "open", browser)

    trigger = mock.Mock(return_value=True)
    monkeypatch.setattr(codex_pipeline, "trigger_working_copy_pull", trigger)

    result = codex_pipeline.sync_to_working_copy(".", dry_run=False)

    assert result is True
    assert "git -C . push working-copy HEAD" in run_calls
    browser.assert_called_once()
    trigger.assert_called_once_with(os.path.basename(os.path.abspath(".")), dry_run=False)


def test_sync_to_working_copy_missing_remote(monkeypatch):
    """Return False and skip actions when the remote is absent."""

    cp = subprocess.CompletedProcess(args=[], returncode=0, stdout="origin\n")
    monkeypatch.setattr(
        codex_pipeline.subprocess,
        "run",
        lambda cmd, capture_output=False, text=False, check=False: cp,
    )

    run_spy = mock.Mock()
    monkeypatch.setattr(codex_pipeline, "run", run_spy)
    browser = mock.Mock()
    monkeypatch.setattr(codex_pipeline.webbrowser, "open", browser)
    trigger = mock.Mock()
    monkeypatch.setattr(codex_pipeline, "trigger_working_copy_pull", trigger)

    assert codex_pipeline.sync_to_working_copy(".", dry_run=False) is False
    run_spy.assert_not_called()
    browser.assert_not_called()
    trigger.assert_not_called()


def test_trigger_working_copy_pull(monkeypatch):
    """The HTTP request to Working Copy is attempted."""
    opener = mock.MagicMock()
    opener.return_value.__enter__.return_value.read.return_value = b"ok"
    monkeypatch.setattr(codex_pipeline.request, "urlopen", opener)

    assert codex_pipeline.trigger_working_copy_pull("repo", dry_run=False)
    opener.assert_called_once()
