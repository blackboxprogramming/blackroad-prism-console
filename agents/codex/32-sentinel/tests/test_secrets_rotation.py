"""Tests for Sentinel secret helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from agents.codex._32_sentinel.secrets.canary import create_canary, is_tripwire
from agents.codex._32_sentinel.secrets.rotate import next_rotation, rotation_metadata, should_rotate


def test_next_rotation_uses_utc() -> None:
    last = datetime(2024, 1, 1, tzinfo=timezone.utc)
    nxt = next_rotation(last)
    assert nxt.tzinfo == timezone.utc
    assert nxt - last == timedelta(days=30)


def test_should_rotate_flags_expired() -> None:
    last = datetime.now(timezone.utc) - timedelta(days=31)
    assert should_rotate(last)


def test_canary_tokens_marked() -> None:
    canary = create_canary("db")
    assert is_tripwire(canary.token)
    meta = rotation_metadata("service-account", datetime(2024, 1, 1, tzinfo=timezone.utc))
    assert meta["principal"] == "service-account"
