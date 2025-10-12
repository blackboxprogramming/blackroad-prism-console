"""Tests for :mod:`agents.cleanup_bot`."""

from subprocess import CalledProcessError

import pytest

from agents.cleanup_bot import CleanupBot


def test_cleanup_bot_dry_run_prints_commands(capsys):
    """Dry-run mode should log delete commands without executing them."""
    bot = CleanupBot(branches=["feature/awesome"], dry_run=True)

    results = bot.cleanup()

    captured = capsys.readouterr().out.strip().splitlines()
    assert captured == [
        "DRY-RUN: git branch -D feature/awesome",
        "DRY-RUN: git push origin --delete feature/awesome",
    ]
    assert results == {"feature/awesome": True}


def test_cleanup_bot_cleanup_handles_failures(monkeypatch: pytest.MonkeyPatch):
    """``CleanupBot`` should mark branches as failed when git commands error."""

    bot = CleanupBot(branches=["bugfix/failure"], dry_run=False)

    def failing_run(*cmd: str) -> None:  # pragma: no cover - exercised via cleanup
        raise CalledProcessError(returncode=1, cmd=list(cmd))

    monkeypatch.setattr(bot, "_run", failing_run)

    results = bot.cleanup()

    assert results == {"bugfix/failure": False}
