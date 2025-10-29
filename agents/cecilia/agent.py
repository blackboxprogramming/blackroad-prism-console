"""Cecilia agent bindings for orchestrator integrations."""

from __future__ import annotations

import json
import pathlib
from dataclasses import dataclass, field
from typing import List, Optional

BASE_PATH = pathlib.Path(__file__).resolve().parents[2] / "home" / "agents" / "cecilia"
STATE_PATH = BASE_PATH / "state" / "current.json"
LOG_PATH = BASE_PATH / "logs" / "session.log"
MEMORY_EXPORT_PATH = BASE_PATH / "memory" / "profile.json"


@dataclass
class MemorySummary:
    """Lightweight snapshot of the agent memory footprint."""

    memory_api_url: str
    log_tail: List[str] = field(default_factory=list)


@dataclass
class AgentProfile:
    """Serializable profile describing the agent identity."""

    agent_id: str
    join_code: Optional[str]
    capabilities: List[str]
    memory_backend: Optional[str]


class CeciliaAgent:
    """Aggregates state, logs, and metadata for orchestration."""

    def __init__(self, memory_api_url: str = "http://localhost:3000") -> None:
        self.memory_api_url = memory_api_url

    def profile(self) -> AgentProfile:
        """Return the agent identity and capability manifest."""

        state = self._read_state()
        return AgentProfile(
            agent_id=state.get("agent_id", "UNKNOWN"),
            join_code=state.get("join_code"),
            capabilities=["memory:index", "memory:search", "status:report"],
            memory_backend=state.get("memory_backend"),
        )

    def memory_summary(self) -> MemorySummary:
        """Describe recent memory activity for diagnostics."""

        tail = []
        if LOG_PATH.exists():
            tail = LOG_PATH.read_text(encoding="utf-8").strip().splitlines()[-5:]
        return MemorySummary(memory_api_url=self.memory_api_url, log_tail=tail)

    def export_profile(self) -> pathlib.Path:
        """Persist the aggregated profile to the memory export directory."""

        MEMORY_EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "profile": self.profile().__dict__,
            "memory": self.memory_summary().__dict__,
            "exported_at": self._now_iso(),
        }
        MEMORY_EXPORT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return MEMORY_EXPORT_PATH

    def _read_state(self) -> dict:
        if not STATE_PATH.exists():
            return {}
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))

    @staticmethod
    def _now_iso() -> str:
        from datetime import datetime, timezone

        return datetime.now(tz=timezone.utc).isoformat()


__all__ = ["CeciliaAgent", "AgentProfile", "MemorySummary"]
