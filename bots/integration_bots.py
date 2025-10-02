"""Auto-generated integration bots sourced from integration documentation.

This module reads the integration inventory documented in
``docs/BLACKROAD_OPS_INTEGRATION_PLAN.md`` and builds a `BaseBot`
implementation for every platform that appears in the table.  Each bot is
responsible for coordinating the notification and Linear hand-off loop that the
user requested when mentioning ``@blackboxprogramming``.

The bots themselves are intentionally lightweight – they capture the mention,
surface the metadata for the integration, and outline the next actions that
keep the human review loop intact without reaching out to external services.
"""

from __future__ import annotations

from pathlib import Path
import re
from typing import Dict, Iterable, List

from orchestrator.base import BaseBot
from orchestrator.protocols import BotResponse, Task


REPO_ROOT = Path(__file__).resolve().parents[1]
INTEGRATION_PLAN_PATH = REPO_ROOT / "docs" / "BLACKROAD_OPS_INTEGRATION_PLAN.md"


def _parse_integration_rows() -> List[Dict[str, str]]:
    """Parse the integration table from the master plan document."""

    rows: List[Dict[str, str]] = []
    table_started = False
    with INTEGRATION_PLAN_PATH.open(encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not table_started:
                if line.startswith("| Category | BlackRoad System |"):
                    table_started = True
                continue

            if not line:
                break

            if line.startswith("| ---"):
                continue

            # Remove leading/trailing pipes, then split the columns.
            columns = [col.strip() for col in line.strip("|").split("|")]
            if len(columns) != 5:
                continue

            category, system_cell, purpose, owner, notes = columns
            match = re.search(r"\*\*(.+?)\*\*\s*\((.+?)\)", system_cell)
            if not match:
                continue

            system_name, platform = match.groups()
            rows.append(
                {
                    "category": category,
                    "system": system_name,
                    "platform": platform,
                    "purpose": purpose,
                    "owner": owner,
                    "notes": notes,
                }
            )
    return rows


def _slugify(value: str) -> str:
    """Create a filesystem-friendly slug for artifact paths."""

    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _class_name(platform: str) -> str:
    """Create a valid Python class name from the platform label."""

    parts = re.split(r"[^0-9a-zA-Z]+", platform)
    return "".join(part.capitalize() for part in parts if part) + "IntegrationBot"


def _detect_mention(task: Task) -> bool:
    """Return True when @blackboxprogramming is referenced in the task."""

    goal = task.goal.lower()
    if "@blackboxprogramming" in goal:
        return True

    context = task.context or {}
    mentions = context.get("mentions")
    if isinstance(mentions, Iterable) and not isinstance(mentions, (str, bytes)):
        for mention in mentions:
            if isinstance(mention, str) and mention.lower() == "@blackboxprogramming":
                return True
    return False


def _make_run(entry: Dict[str, str]):  # type: ignore[override]
    slug = _slugify(entry["platform"])

    def run(self, task: Task, _entry: Dict[str, str] = entry, _slug: str = slug) -> BotResponse:
        mention_detected = _detect_mention(task)

        state_word = "Prepared" if mention_detected else "Queued"
        summary = (
            f"{state_word} {_entry['platform']} integration loop so the team stays in sync "
            "after @blackboxprogramming is tagged."
        )

        steps = [
            "Capture @blackboxprogramming mention and log the request context",
            f"Notify {_entry['system']} stakeholders for visibility",
            "Draft Linear ticket with integration metadata",
            "Coordinate peer review and close the loop back in Linear",
        ]

        data = {
            "category": _entry["category"],
            "system": _entry["system"],
            "platform": _entry["platform"],
            "purpose": _entry["purpose"],
            "owner": _entry["owner"],
            "notes": _entry["notes"],
            "mention_detected": mention_detected,
            "linear_payload": {
                "team": _entry["owner"],
                "title": f"{_entry['platform']} follow-up for {task.goal}",
                "tags": ["integration", _slug, "blackboxprogramming"],
                "status": "pending-review",
            },
        }

        risks = [
            "Notifications and Linear hand-off are simulated; production hooks must be configured.",
            f"Confirm {_entry['platform']} access and ownership with {_entry['owner']} before execution.",
        ]

        artifacts = [f"/artifacts/{task.id}/{_slug}-handoff.json"]

        if mention_detected:
            next_actions = [
                "Review Linear draft with assigned reviewers",
                "Provide integration feedback in-platform",
                "Comment back @blackboxprogramming in Linear once approvals land",
            ]
        else:
            next_actions = [
                "Watch for @blackboxprogramming mention to activate notifications",
                "Keep integration context warm for rapid hand-off",
                "Confirm reviewer availability in advance",
            ]

        return BotResponse(
            task_id=task.id,
            summary=summary,
            steps=steps,
            data=data,
            risks=risks,
            artifacts=artifacts,
            next_actions=next_actions,
            ok=mention_detected,
        )

    return run


INTEGRATION_ENTRIES = _parse_integration_rows()

__all__: List[str] = []

for entry in INTEGRATION_ENTRIES:
    class_name = _class_name(entry["platform"])
    bot_cls = type(
        class_name,
        (BaseBot,),
        {
            "__doc__": (
                f"Automation loop for the {entry['platform']} integration derived from the "
                "integration master plan."
            ),
            "name": f"{entry['platform']}-BOT",
            "mission": (
                "Keep the team informed and coordinate Linear hand-offs whenever "
                "@blackboxprogramming mentions involve this integration."
            ),
            "run": _make_run(entry),
        },
    )
    bot_cls.__module__ = __name__
    globals()[class_name] = bot_cls
    __all__.append(class_name)


def integration_bot_names() -> List[str]:
    """Expose the human-readable bot names for testing and discovery."""

    return [f"{entry['platform']}-BOT" for entry in INTEGRATION_ENTRIES]

