"""Base classes and helpers for BlackRoad agent plugins."""

from __future__ import annotations

from typing import Dict

from agent.config import PluginMount


class BasePlugin:
    """Lightweight convenience superclass for runtime plugins."""

    name: str = "base"

    def activate(self, config: PluginMount) -> None:  # pragma: no cover - hook
        """Optional hook executed once during runtime bootstrap."""

    def handle(self, message: str, context: Dict[str, object]) -> str:
        """Process a message and return the modified text."""

        return message
