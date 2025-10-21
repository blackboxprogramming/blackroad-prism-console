import inspect
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Type

import settings
from bots import available_bots
from orchestrator import lineage, redaction
from policy import enforcer
from tools import storage

from .base import BaseBot, assert_guardrails
from .memory_manager import MemoryManager, MemoryOperationError
from .perf import perf_timer
from .protocols import BotResponse, Task
from .slo import SLO_CATALOG
from .status import StatusBroadcaster

LOGGER = logging.getLogger(__name__)

_module_path = Path(__file__).resolve()
_memory_path = _module_path.with_name("memory.jsonl")
_config_root = _module_path.parent.parent
_memory_config_path = _config_root / "agents" / "memory" / "memory.yaml"

memory_manager = MemoryManager.from_yaml(_memory_config_path)
status_broadcaster = StatusBroadcaster(channel="#blackroad-status")
import metrics
import settings
from bots import available_bots
from safety import duty_of_care, policy
from tools import storage

from .base import BaseBot, assert_guardrails
from .perf import perf_timer
from .protocols import BotResponse, Task
from .slo import SLO_CATALOG

_current_doc = ""


def red_team(response: BotResponse) -> None:
    """Basic red team checks on a response."""
    if not response.summary.strip():
        raise AssertionError("Summary missing")
    if not response.risks:
        raise AssertionError("Risks required")
    if "KPIS" in _current_doc.upper() and "KPI" not in response.summary.upper():
        raise AssertionError("KPIs not referenced")


def route(task: Task, bot_name: str, safety_packs: list[str] | None = None) -> BotResponse:
    """Route a task to the named bot and log the interaction."""
    registry: Dict[str, Type[BaseBot]] = available_bots()
    if bot_name not in registry:
        raise ValueError(f"Unknown bot: {bot_name}")

    violations = enforcer.check_task(task)
    if bot_name in settings.FORBIDDEN_BOTS:
        violations.append("TASK_FORBIDDEN_BOT")
    enforcer.enforce_or_raise(violations)

    scrubbed_ctx = redaction.scrub(task.context) if task.context else None
    memory_manager.start_turn(scrubbed_ctx or {})

    trace_id = lineage.start_trace(task.id)

    hydrated_memory = memory_manager.hydrate_state()
    enriched_context = dict(scrubbed_ctx or {})
    enriched_context["memory"] = hydrated_memory
    task = Task(id=task.id, goal=task.goal, context=enriched_context, created_at=task.created_at)

    bot = registry[bot_name]()
    global _current_doc
    _current_doc = inspect.getdoc(bot) or ""

    owner = enriched_context.get("owner", "unassigned")
    status_links = {"trace": f"logs://{bot_name}/{trace_id}"}
    status_broadcaster.emit(
        agent=bot_name,
        status="running",
        owner=owner,
        task=task.goal,
        next_step="act",
        links=status_links,
    )

    slo = SLO_CATALOG.get(bot_name)
    with perf_timer("bot_run") as perf:
        try:
            response = bot.run(task)
        except Exception:
            status_broadcaster.emit(
                agent=bot_name,
                status="blocked",
                owner=owner,
                task=task.goal,
                next_step="Escalate to on-call",
                links=status_links,
            )
            lineage.finalize(trace_id)
            raise
    response.elapsed_ms = perf.get("elapsed_ms")
    response.rss_mb = perf.get("rss_mb")
    if slo:
        response.slo_name = slo.name
        response.p50_target = slo.p50_ms
        response.p95_target = slo.p95_ms
        response.max_mem_mb = slo.max_mem_mb
    with perf_timer("bot_run") as perf:
        response = bot.run(task)
    assert_guardrails(response)
    red_team(response)
    violations = policy.evaluate(response, safety_packs or settings.PACKS_ENABLED)
    if settings.DUTY_OF_CARE:
        err = duty_of_care.gate(violations)
        if err:
            raise RuntimeError(err)

    resp_dict = redaction.scrub(response.model_dump(mode="python"))
    response = BotResponse(**resp_dict)

    memory_manager.record_task_result(
        goal=task.goal,
        constraints=enriched_context.get("constraints"),
        artifacts=response.artifacts,
        open_questions=enriched_context.get("open_questions"),
    )
    if response.memory_ops:
        for op in response.memory_ops:
            try:
                memory_manager.apply_op(op)
            except MemoryOperationError as exc:
                LOGGER.warning("memory_op_failed", extra={"error": str(exc), "operation": op})

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
    lineage.finalize(trace_id)
    status_broadcaster.emit(
        agent=bot_name,
        status="completed",
        owner=owner,
        task=task.goal,
        next_step=(response.next_actions[0] if response.next_actions else None),
        links={
            "trace": status_links["trace"],
            "artifact": response.artifacts[0] if response.artifacts else None,
        },
    )
    metrics.record("orchestrator_run", {"bot": bot_name, "task": task.id})
    return response
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict

from bots import BOT_REGISTRY, BaseBot
from orchestrator.protocols import BotResponse, Task


class Orchestrator:
    """Routes tasks to bots and logs interactions."""

    def __init__(
        self, base_path: Path | None = None, bots: Dict[str, BaseBot] | None = None
    ) -> None:
        self.base_path = base_path or Path(__file__).resolve().parent.parent
        self.memory_path = self.base_path / "memory.jsonl"
        self.artifacts_dir = self.base_path / "artifacts"
        self.artifacts_dir.mkdir(exist_ok=True)
        self.bots = bots or BOT_REGISTRY

    def route(self, task: Task, bot_name: str) -> BotResponse:
        bot = self.bots[bot_name]
        response = bot.run(task)
        response_payload = response.model_dump()
        self._log(
            {
                "type": "response",
                "task_id": task.id,
                "bot": bot_name,
                "response": response_payload,
            }
        )
        artifact_dir = self.artifacts_dir / task.id
        artifact_dir.mkdir(parents=True, exist_ok=True)
        with open(artifact_dir / "response.json", "w") as fh:
            json.dump(response_payload, fh, indent=2)
        self.red_team(response)
        return response

    def red_team(self, response: BotResponse) -> None:
        if not response.risks_gaps:
            raise ValueError("Risks/Gaps must be provided")

    def _log(self, entry: Dict) -> None:
        entry["timestamp"] = datetime.utcnow().isoformat()
        with open(self.memory_path, "a") as fh:
            fh.write(json.dumps(entry) + "\n")
