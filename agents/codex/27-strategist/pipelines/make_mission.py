"""Mission planning utilities for Codex-27.

The helpers in this module translate lightweight goal intents into a
normalised mission canvas. A mission canvas adheres to the
``mission.schema.json`` contract shipped with the Strategist agent.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Mapping, Optional

import json

import yaml

SCHEMA_DIR = Path(__file__).resolve().parent.parent / "schemas"
MISSION_SCHEMA_PATH = SCHEMA_DIR / "mission.schema.json"


@dataclass
class MissionRole:
    """Representation of a mission role assignment."""

    name: str
    agent: str
    backup: Optional[str] = None

    def to_dict(self) -> Dict[str, str]:
        """Return a serialisable dictionary representation."""
        payload: Dict[str, str] = {"name": self.name, "agent": self.agent}
        if self.backup:
            payload["backup"] = self.backup
        return payload


@dataclass
class MissionBudget:
    """Energy budget expressed in joules."""

    joules_target: float
    joules_max: float

    def to_dict(self) -> Dict[str, float]:
        """Return the budget as a dictionary."""
        return {
            "joules_target": float(self.joules_target),
            "joules_max": float(self.joules_max),
        }


@dataclass
class MissionTimeline:
    """Mission timeline metadata."""

    start: datetime
    deadline: datetime
    checkpoints: List[Mapping[str, datetime]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, object]:
        """Serialise the timeline to ISO 8601 strings."""
        return {
            "start": self.start.isoformat(),
            "deadline": self.deadline.isoformat(),
            "checkpoints": [
                {"name": str(chk["name"]), "time": chk["time"].isoformat()}
                for chk in self.checkpoints
            ],
        }


@dataclass
class MissionCanvas:
    """Full mission canvas ready for validation or publication."""

    goal: str
    constraints: Iterable[str]
    roles: Iterable[MissionRole]
    budget: MissionBudget
    timeline: MissionTimeline
    exit_success: str
    exit_abort: str
    notes: Optional[str] = None

    def to_dict(self) -> Dict[str, object]:
        """Generate a dictionary compliant with the mission schema."""
        data: Dict[str, object] = {
            "goal": self.goal,
            "constraints": list(self.constraints),
            "roles": [role.to_dict() for role in self.roles],
            "budget": self.budget.to_dict(),
            "timeline": self.timeline.to_dict(),
            "exit": {
                "success": self.exit_success,
                "abort": self.exit_abort,
            },
        }
        if self.notes:
            data["notes"] = self.notes
        return data


def _default_timeline(now: Optional[datetime] = None) -> MissionTimeline:
    """Construct a default mission timeline relative to *now*."""
    current = now or datetime.now(tz=timezone.utc)
    deadline = current + timedelta(days=2)
    checkpoints = [
        {"name": "T0 sync", "time": current + timedelta(hours=4)},
        {"name": "T1 review", "time": current + timedelta(days=1)},
    ]
    return MissionTimeline(start=current, deadline=deadline, checkpoints=checkpoints)


def load_mission_schema() -> Dict[str, object]:
    """Load the mission JSON schema packaged with the Strategist."""
    return json.loads(MISSION_SCHEMA_PATH.read_text(encoding="utf-8"))


def propose(goal_intent: Mapping[str, object]) -> Dict[str, object]:
    """Generate a mission canvas from a goal intent payload.

    Parameters
    ----------
    goal_intent:
        A mapping with ``goal`` (str) and optional overrides for constraints,
        roles, joule budget, notes, and timeline hints.
    """
    goal = str(goal_intent.get("goal", ""))
    if not goal:
        raise ValueError("Goal intent must include a 'goal' description.")

    constraints = goal_intent.get("constraints", []) or ["respect_guardrails"]
    roles_payload = goal_intent.get("roles", [])
    if roles_payload:
        roles = [
            MissionRole(name=item["name"], agent=item["agent"], backup=item.get("backup"))
            for item in roles_payload
        ]
    else:
        roles = [
            MissionRole(name="Strategist", agent="Codex-27"),
            MissionRole(name="Guardian", agent="Guardian"),
        ]

    budget_data = goal_intent.get("budget", {})
    budget = MissionBudget(
        joules_target=float(budget_data.get("joules_target", 750.0)),
        joules_max=float(budget_data.get("joules_max", 1000.0)),
    )

    timeline = _default_timeline()
    notes = goal_intent.get("notes")

    mission = MissionCanvas(
        goal=goal,
        constraints=constraints,
        roles=roles,
        budget=budget,
        timeline=timeline,
        exit_success=str(goal_intent.get("exit_success", "outcome achieved")),
        exit_abort=str(goal_intent.get("exit_abort", "rollback complete")),
        notes=str(notes) if notes else None,
    )
    return mission.to_dict()


def save_mission(plan: Mapping[str, object], destination: Path) -> None:
    """Persist a mission plan to disk as YAML."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(yaml.safe_dump(dict(plan)), encoding="utf-8")


__all__ = [
    "MissionRole",
    "MissionBudget",
    "MissionTimeline",
    "MissionCanvas",
    "load_mission_schema",
    "propose",
    "save_mission",
]
