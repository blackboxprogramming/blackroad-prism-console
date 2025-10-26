"""Playbook dispatcher for Strategist formations."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional

import uuid

import yaml

PLAYBOOK_DIR = Path(__file__).resolve().parent.parent / "playbooks"


@dataclass
class PlayStep:
    """Represents a single playbook action."""

    action: str
    payload: Mapping[str, Any]

    def describe(self) -> str:
        """Produce a human readable description of the step."""
        return f"{self.action}: {self.payload}"


@dataclass
class PlaybookTrace:
    """Execution trace for a playbook run."""

    playbook_id: str
    steps: List[PlayStep]
    rollback: List[PlayStep]
    context: Mapping[str, Any]
    trace_id: str

    def as_dict(self) -> Dict[str, Any]:
        """Serialise the trace to a dictionary."""
        return {
            "playbook_id": self.playbook_id,
            "trace_id": self.trace_id,
            "context": dict(self.context),
            "steps": [step.describe() for step in self.steps],
            "rollback": [step.describe() for step in self.rollback],
        }


def _as_step(action: str, payload: Any) -> PlayStep:
    if isinstance(payload, Mapping):
        mapped: Mapping[str, Any] = payload
    else:
        mapped = {"value": payload}
    return PlayStep(action=action, payload=mapped)


def load_playbook(playbook_id: str) -> Dict[str, Any]:
    """Load a playbook from disk."""
    path = PLAYBOOK_DIR / f"{playbook_id}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Playbook {playbook_id} not found at {path}.")
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def trace_play(playbook: Mapping[str, Any], context: Optional[Mapping[str, Any]] = None) -> PlaybookTrace:
    """Create an execution trace for a playbook without side effects."""
    steps = [_as_step(key, item[key]) for item in playbook.get("steps", []) for key in item]
    rollback = [_as_step(key, item[key]) for item in playbook.get("rollback", []) for key in item]
    trace_id = uuid.uuid4().hex
    return PlaybookTrace(
        playbook_id=playbook["id"],
        steps=steps,
        rollback=rollback,
        context=context or {},
        trace_id=trace_id,
    )


def run_playbook(playbook_id: str, context: Optional[Mapping[str, Any]] = None) -> PlaybookTrace:
    """Load a playbook and return the planned execution trace."""
    playbook = load_playbook(playbook_id)
    return trace_play(playbook, context=context)


__all__ = ["PlayStep", "PlaybookTrace", "load_playbook", "trace_play", "run_playbook"]
