"""Action manifest loader."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

import yaml


@dataclass
class Action:
    id: str
    summary: str
    plugin: str
    inputs: Dict[str, Dict[str, object]]


class ActionCatalog:
    """Catalog of actions the agent can execute."""

    def __init__(self, actions: List[Action]):
        self._actions = {action.id: action for action in actions}

    @classmethod
    def from_path(cls, path: Path) -> "ActionCatalog":
        with path.open("r", encoding="utf-8") as handle:
            raw = yaml.safe_load(handle) or {}
        actions = [
            Action(
                id=item["id"],
                summary=item.get("summary", ""),
                plugin=item["plugin"],
                inputs=item.get("inputs", {}),
            )
            for item in raw.get("actions", [])
        ]
        return cls(actions)

    def by_id(self, action_id: str) -> Action:
        if action_id not in self._actions:
            raise KeyError(f"Unknown action: {action_id}")
        return self._actions[action_id]

    def all(self) -> List[Action]:
        return list(self._actions.values())
