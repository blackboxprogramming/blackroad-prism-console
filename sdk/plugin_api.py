from dataclasses import dataclass, field
from types import SimpleNamespace
from typing import Callable, Dict, Type, Any

# Simple in-memory settings and storage objects
_settings = SimpleNamespace(EXECUTION_MODE="inproc", LANG="en", THEME="light")
_storage: Dict[str, Any] = {}

BOT_REGISTRY: Dict[str, Type["BaseBot"]] = {}

@dataclass
class Task:
    """Represents a unit of work for a bot."""
    intent: str
    inputs: Dict[str, Any] = field(default_factory=dict)

@dataclass
class BotResponse:
    """Standard response from a bot."""
    ok: bool
    content: str = ""
    data: Dict[str, Any] = field(default_factory=dict)

class BaseBot:
    """Base class for all bots."""
    NAME = "BaseBot"

    def handle(self, task: Task) -> BotResponse:  # pragma: no cover - interface only
        raise NotImplementedError

def register_plugin_bot(bot_cls: Type[BaseBot]) -> None:
    """Register a bot class exposed by a plugin."""
    BOT_REGISTRY[bot_cls.NAME] = bot_cls

def get_settings() -> SimpleNamespace:
    return _settings

def get_storage() -> Dict[str, Any]:
    return _storage
