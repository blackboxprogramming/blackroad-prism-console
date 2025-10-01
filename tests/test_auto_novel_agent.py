"""Tests for :mod:`agents.auto_novel_agent`."""

import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_generate_novel_outline_returns_expected_headings():
    agent = AutoNovelAgent()

    outline = agent.generate_novel_outline("The Quest", chapters=2)

    assert outline == ["Chapter 1: The Quest", "Chapter 2: The Quest"]


def test_generate_novel_outline_rejects_zero_chapters():
    agent = AutoNovelAgent()

    with pytest.raises(ValueError, match="Number of chapters must be at least 1"):
        agent.generate_novel_outline("Adventure", chapters=0)


def test_generate_novel_outline_rejects_blank_title():
    agent = AutoNovelAgent()

    with pytest.raises(ValueError, match="Title must be a non-empty string"):
        agent.generate_novel_outline("   ")
