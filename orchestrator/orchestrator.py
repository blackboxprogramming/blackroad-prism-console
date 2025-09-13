import inspect
from datetime import datetime
from pathlib import Path
from typing import Dict, Type

from bots import available_bots
from tools import storage

from .base import BaseBot, assert_guardrails
from .perf import perf_timer
from .protocols import BotResponse, Task
from .slo import SLO_CATALOG

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

    with perf_timer("bot_run") as perf:
        response = bot.run(task)
    assert_guardrails(response)
    red_team(response)

    record = {
        "ts": datetime.utcnow().isoformat(),
        "task": task.model_dump(mode="json"),
        "bot": bot_name,
        "response": response.model_dump(mode="json"),
        "perf": perf,
    }
    slo = SLO_CATALOG.get(bot_name)
    if slo:
        record.update(
            {
                "slo_name": slo.name,
                "p50_target": slo.p50_ms,
                "p95_target": slo.p95_ms,
                "max_mem_mb": slo.max_mem_mb,
            }
        )
    storage.write(str(_memory_path), record)
    return response
