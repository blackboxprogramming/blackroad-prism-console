"""Tests for the Lucidia multi-agent chat portal."""

from modules.lucidia import AutoNovelAdapter, LucidiaPortal


def test_story_response() -> None:
    portal = LucidiaPortal([AutoNovelAdapter()])
    responses = portal.chat("tell me a story about space exploration")
    assert "space exploration" in responses["AutoNovelAgent"].lower()


def test_create_game_response() -> None:
    portal = LucidiaPortal([AutoNovelAdapter()])
    responses = portal.chat("please create a game in Unity")
    assert "creating a unity game without weapons" in responses["AutoNovelAgent"].lower()
