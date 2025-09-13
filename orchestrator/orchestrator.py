import inspect
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Type

from bots import available_bots
from finance import costing
from tools import storage

from .base import BaseBot, assert_guardrails
from .protocols import BotResponse, Task

_memory_path = Path(__file__).resolve().with_name("memory.jsonl")
_current_doc = ""


def red_team(response: BotResponse) -> None:
    """Basic red team checks on a response."""
    if not response.summary.strip():
        raise AssertionError("Summary missing")
    if not response.risks:
        raise AssertionError("Risks required")
    if "KPIS" in _current_doc.upper() and "KPI" not in response.summary.upper():
        raise AssertionError("KPIs not referenced")


def route(task: Task, bot_name: str) -> BotResponse:
    """Route a task to the named bot and log the interaction."""
    registry: Dict[str, Type[BaseBot]] = available_bots()
    if bot_name not in registry:
        raise ValueError(f"Unknown bot: {bot_name}")
    bot = registry[bot_name]()

    global _current_doc
    _current_doc = inspect.getdoc(bot) or ""

    response = bot.run(task)
    assert_guardrails(response)
    red_team(response)

    record = {
        "ts": datetime.utcnow().isoformat(),
        "task": task.model_dump(mode="json"),
        "bot": bot_name,
        "response": response.model_dump(mode="json"),
    }
    storage.write(str(_memory_path), record)
    costing.log(bot_name, user=os.getenv("PRISM_USER"), tenant=os.getenv("PRISM_TENANT"))
    return response
