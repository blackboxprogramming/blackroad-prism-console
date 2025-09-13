from __future__ import annotations

import json
from pathlib import Path
from typing import List

import settings
from orchestrator import metrics
from orchestrator.protocols import BotResponse, Task


class BotExecutionError(RuntimeError):
    """Raised when a policy violation occurs during bot execution."""

    def __init__(self, code: str, details: List[str] | None = None):
        super().__init__(code)
        self.code = code
        self.details = details or []


def check_task(task: Task) -> List[str]:
    """Validate a task against policy rules."""
    violations: List[str] = []

    # Context size limit (reuse MAX_ARTIFACT_MB in MB)
    if task.context is not None:
        size_bytes = len(json.dumps(task.context))
        if size_bytes > settings.MAX_ARTIFACT_MB * 1024 * 1024:
            violations.append("TASK_CONTEXT_TOO_LARGE")

        if not task.context.get("approved"):
            violations.append("TASK_MISSING_APPROVAL")

    goal_lower = task.goal.lower()
    for intent in settings.FORBIDDEN_INTENTS:
        if intent.lower() in goal_lower:
            violations.append("TASK_FORBIDDEN_INTENT")
            break

    return violations


def check_response(bot_name: str, response: BotResponse) -> List[str]:
    """Validate a bot response against policy rules."""
    violations: List[str] = []

    if bot_name in settings.FORBIDDEN_BOTS:
        violations.append("RESP_FORBIDDEN_BOT")

    if not response.risks:
        violations.append("RESP_MISSING_RISKS")

    if "KPI" in response.summary.upper() and "kpis" not in response.data:
        violations.append("RESP_MISSING_KPIS")

    for art in response.artifacts:
        p = Path(art)
        if p.exists():
            if p.stat().st_size > settings.MAX_ARTIFACT_MB * 1024 * 1024:
                violations.append("RESP_ARTIFACT_TOO_LARGE")
        # if file missing we ignore; bots may reference virtual artifacts

    return violations


def enforce_or_raise(violations: List[str]) -> None:
    """Raise BotExecutionError if violations exist."""
    if violations:
        metrics.inc("policy_violation", len(violations))
        for code in violations:
            metrics.inc(f"policy_violation_{code}")
        raise BotExecutionError("policy_violation", details=violations)
