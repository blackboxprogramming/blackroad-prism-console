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

    browser = mock.Mock()
    monkeypatch.setattr(codex_pipeline.webbrowser, "open", browser)

    trigger = mock.Mock()
    monkeypatch.setattr(codex_pipeline, "trigger_working_copy_pull", trigger)

    codex_pipeline.sync_to_working_copy(".", dry_run=False)

    assert "git -C . push working-copy HEAD" in run_calls
    browser.assert_called_once()
    trigger.assert_called_once_with(os.path.basename(os.path.abspath(".")), dry_run=False)


def test_trigger_working_copy_pull(monkeypatch):
    """The HTTP request to Working Copy is attempted."""
    opener = mock.MagicMock()
    opener.return_value.__enter__.return_value.read.return_value = b"ok"
    monkeypatch.setattr(codex_pipeline.request, "urlopen", opener)

    assert codex_pipeline.trigger_working_copy_pull("repo", dry_run=False)
    opener.assert_called_once()
