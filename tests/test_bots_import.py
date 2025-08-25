"""Ensure all bot modules import cleanly and expose a bot class."""

import importlib
import inspect
from pathlib import Path

BOTS_DIR = Path(__file__).resolve().parent.parent / "agents"


def iter_bot_modules() -> list[str]:
    modules: list[str] = []
    for path in BOTS_DIR.glob("*_bot.py"):
        modules.append(f"agents.{path.stem}")
    return modules


def test_bot_modules_import_and_have_class() -> None:
    for module_name in iter_bot_modules():
        module = importlib.import_module(module_name)
        assert module.__doc__ and module.__doc__.strip()
        bots = [name for name, obj in inspect.getmembers(module, inspect.isclass) if name.endswith("Bot")]
        assert bots, f"{module_name} should define a bot class"
