from __future__ import annotations

import inspect
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Type

import settings
from bots import available_bots
from orchestrator import lineage, metrics, redaction
from policy import enforcer
from tools import storage

from .base import BaseBot, assert_guardrails
from .perf import perf_timer
from .protocols import BotResponse, Task
from .slo import SLO_CATALOG

logger = logging.getLogger(__name__)

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

    logger.info("routing task", extra={"task_id": task.id, "bot": bot_name})
    metrics.inc("orchestrator_tasks_total")
    metrics.inc(f"orchestrator_tasks_bot_{bot_name}")

    violations = enforcer.check_task(task)
    if bot_name in settings.FORBIDDEN_BOTS:
        violations.append("TASK_FORBIDDEN_BOT")
    enforcer.enforce_or_raise(violations)

    scrubbed_ctx = redaction.scrub(task.context) if task.context else None
    task = Task(id=task.id, goal=task.goal, context=scrubbed_ctx, created_at=task.created_at)

    trace_id = lineage.start_trace(task.id)

    bot = registry[bot_name]()
    global _current_doc
    _current_doc = inspect.getdoc(bot) or ""

    slo = SLO_CATALOG.get(bot_name)
    try:
        with perf_timer("bot_run") as perf:
            response = bot.run(task)
    except Exception:
        metrics.inc("orchestrator_task_failures_total")
        metrics.inc(f"orchestrator_task_failures_bot_{bot_name}")
        logger.exception("bot run failed", extra={"task_id": task.id, "bot": bot_name, "trace_id": trace_id})
        lineage.finalize(trace_id)
        raise

    response.elapsed_ms = perf.get("elapsed_ms")
    response.rss_mb = perf.get("rss_mb")
    if response.elapsed_ms is not None:
        metrics.gauge("orchestrator_last_run_elapsed_ms", int(response.elapsed_ms))
    if response.rss_mb is not None:
        metrics.gauge("orchestrator_last_run_rss_mb", int(response.rss_mb))
    if slo:
        response.slo_name = slo.name
        response.p50_target = slo.p50_ms
        response.p95_target = slo.p95_ms
        response.max_mem_mb = slo.max_mem_mb
    assert_guardrails(response)
    red_team(response)

    resp_dict = redaction.scrub(response.model_dump(mode="python"))
    response = BotResponse(**resp_dict)

    violations = enforcer.check_response(bot_name, response)
    enforcer.enforce_or_raise(violations)

    record = {
        "ts": datetime.utcnow().isoformat(),
        "task": task.model_dump(mode="json"),
        "bot": bot_name,
        "trace_id": trace_id,
        "response": response.model_dump(mode="json"),
        "perf": perf,
        "artifacts": [{"path": a, "trace_id": trace_id} for a in response.artifacts],
    }
    if slo:
        record["slo"] = {
            "p50_target": slo.p50_ms,
            "p95_target": slo.p95_ms,
            "max_mem_mb": slo.max_mem_mb,
        }
    storage.write(str(_memory_path), record)
    lineage.finalize(trace_id)
    metrics.inc("orchestrator_task_success_total")
    metrics.inc(f"orchestrator_task_success_bot_{bot_name}")
    logger.info(
        "task completed",
        extra={
            "task_id": task.id,
            "bot": bot_name,
            "trace_id": trace_id,
            "elapsed_ms": response.elapsed_ms,
        },
    )
    return response
