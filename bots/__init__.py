"""Bot registry and auto-discovery."""

from __future__ import annotations

from importlib import import_module
from pathlib import Path
from typing import Dict

from orchestrator.protocols import BaseBot

BOT_REGISTRY: Dict[str, BaseBot] = {}


def _discover() -> None:
    pkg_path = Path(__file__).parent
    for mod in pkg_path.glob("*_bot.py"):
        module = import_module(f"bots.{mod.stem}")
        bot_cls = getattr(module, "Bot", None)
        if bot_cls is None:
            continue
        bot: BaseBot = bot_cls()
        BOT_REGISTRY[bot.NAME] = bot


_discover()

__all__ = ["BOT_REGISTRY"]

