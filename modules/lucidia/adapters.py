"""Adapters for integrating existing agents with the portal."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Optional

# Ensure we can import from the standalone ``agents`` directory.
AGENTS_PATH = Path(__file__).resolve().parents[2] / "agents"
if str(AGENTS_PATH) not in sys.path:
    sys.path.append(str(AGENTS_PATH))

from auto_novel_agent import AutoNovelAgent  # type: ignore


class AutoNovelAdapter:
    """Wrap :class:`AutoNovelAgent` to provide chat-style responses."""

    name = "AutoNovelAgent"

    def __init__(self, agent: Optional[AutoNovelAgent] = None) -> None:
        self.agent = agent or AutoNovelAgent()

    def respond(self, message: str) -> str:
        msg = message.lower()
        story_match = re.search(r"story about (.+)", msg)
        if story_match:
            theme = story_match.group(1).strip()
            return self.agent.generate_story(theme)

        game_match = re.search(r"create (?:a )?game.*in\s+([\w-]+)", msg)
        if game_match:
            engine = game_match.group(1)
            try:
                self.agent.create_game(engine)
                return f"Creating a {engine.capitalize()} game without weapons..."
            except Exception as exc:  # noqa: BLE001 - provide user feedback
                return str(exc)

        return "AutoNovelAgent is unsure how to respond."
