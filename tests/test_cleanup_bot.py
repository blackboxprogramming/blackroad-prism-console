import subprocess

import pytest

from agents.cleanup_bot import CleanupBot
import agents.cleanup_bot as cleanup_bot_module


def test_cleanup_bot_dry_run_reports_actions(capsys):
    bot = CleanupBot(["feature/foo", "bugfix/bar"], dry_run=True)

    results = bot.cleanup()

    assert results == {"feature/foo": True, "bugfix/bar": True}
    captured = capsys.readouterr()
    assert "Would delete branch 'feature/foo' locally and remotely" in captured.out
    assert "Would delete branch 'bugfix/bar' locally and remotely" in captured.out


def test_cleanup_bot_executes_git_commands(monkeypatch):
    calls = []

    def fake_run(cmd, check):
        calls.append((tuple(cmd), check))

    monkeypatch.setattr(cleanup_bot_module.subprocess, "run", fake_run)
    bot = CleanupBot(["feature/new"], dry_run=False)

    results = bot.cleanup()

    assert results == {"feature/new": True}
    assert calls == [
        (("git", "branch", "-D", "feature/new"), True),
        (("git", "push", "origin", "--delete", "feature/new"), True),
    ]


def test_cleanup_bot_reports_failures(monkeypatch, capsys):
    calls = []

    def fake_run(cmd, check):
        calls.append(tuple(cmd))
        raise subprocess.CalledProcessError(returncode=1, cmd=cmd)

    monkeypatch.setattr(cleanup_bot_module.subprocess, "run", fake_run)
    bot = CleanupBot(["feature/bad"], dry_run=False)

    results = bot.cleanup()

    assert results == {"feature/bad": False}
    captured = capsys.readouterr()
    assert "Failed to delete branch 'feature/bad' locally or remotely" in captured.out
    # Ensure the remote deletion was not attempted after failure.
    assert calls == [("git", "branch", "-D", "feature/bad")]
