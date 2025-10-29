"""Python interface for interacting with the Cecilia agent profile and memory."""
"""Cecilia agent bindings for orchestrator integrations."""

from __future__ import annotations

import json
import os
import sqlite3
from collections import Counter
from copy import deepcopy
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional
"""Runtime helper utilities for interacting with the Cecilia agent."""

from __future__ import annotations

from collections import Counter
import json
import os
from pathlib import Path
import sqlite3
from typing import Any, Dict, Optional

from bots.cecilia_bot import (
    CECILIA_AGENT_ID,
    CECILIA_ALIASES as _BOT_ALIASES,
    CECILIA_PROFILE as _BOT_PROFILE,
)

CECILIA_ALIASES: tuple[str, ...] = tuple(sorted(_BOT_ALIASES))

DEFAULT_DB_CANDIDATES: tuple[Path, ...] = (
    Path("/srv/blackroad-api/memory.db"),
    Path("/var/lib/prism/memory.db"),
)

CECILIA_ALIASES: tuple[str, ...] = tuple(sorted(_BOT_ALIASES))


@dataclass
class CeciliaAgent:
    """Expose Cecilia's identity and surface basic memory inspection tools."""

    memory_dir: str | Path
    memory_db: Optional[str | Path] = None
    agent_id: str = field(default=CECILIA_AGENT_ID, init=False)
    aliases: tuple[str, ...] = field(default=CECILIA_ALIASES, init=False)

    def __post_init__(self) -> None:
        self.memory_dir = Path(self.memory_dir)
        if self.memory_db is not None:
            self.memory_db = Path(self.memory_db)
        else:
            self.memory_db = self._detect_memory_db()

class CeciliaAgent:
    """Utility wrapper around the Cecilia bot definition and memory store."""

    def __init__(
        self,
        memory_dir: Optional[str | Path] = None,
        memory_db: Optional[str | Path] = None,
    ) -> None:
        self.agent_id: str = CECILIA_AGENT_ID
        self.aliases: tuple[str, ...] = CECILIA_ALIASES
        self.memory_dir: Optional[Path] = Path(memory_dir) if memory_dir else None
        explicit_db = Path(memory_db) if memory_db else None
        self.memory_db: Optional[Path] = explicit_db or self._detect_memory_db()

    # ------------------------------------------------------------------
    # Profile helpers
    # ------------------------------------------------------------------
    def profile(self, include_memory: bool = True) -> Dict[str, Any]:
        """Return Cecilia's profile optionally enriched with memory metadata."""

        payload: Dict[str, Any] = json.loads(json.dumps(_BOT_PROFILE))
        payload["aliases"] = list(self.aliases)
        if include_memory:
            payload["memory"] = self._memory_summary()
        return payload

    def export_profile(self, destination: str | Path, include_memory: bool = True) -> Path:
        """Write Cecilia's profile (optionally enriched with memory info) to disk."""

        target = Path(destination)
        target.parent.mkdir(parents=True, exist_ok=True)
        payload = self.profile(include_memory=include_memory)
        target.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
        return target

    # ------------------------------------------------------------------
    # Memory helpers
    # ------------------------------------------------------------------
    def _memory_summary(self) -> Dict[str, Any]:
        """Summarise the backing memory database if available."""

        if self.memory_db is None:
            return {"status": "unconfigured"}

        summary: Dict[str, Any] = {"path": str(self.memory_db)}
        if not self.memory_db.exists():
            summary["status"] = "missing"
            return summary

        summary["status"] = "available"
        sources = self._count_database_sources(self.memory_db)
        summary["sources"] = sources
        summary["total_entries"] = sum(sources.values())
        return summary

    def _detect_memory_db(self) -> Optional[Path]:
        """Locate a memory database using environment hints and common defaults."""

        candidates: list[Path] = []
        env_db = os.getenv("MEMORY_DB")
        if env_db:
            candidates.append(Path(env_db))
        if self.memory_dir:
            candidates.append(self.memory_dir / "memory.db")
        candidates.extend(DEFAULT_DB_CANDIDATES)

        env_db = os.getenv("MEMORY_DB")
        if env_db:
            candidates.append(Path(env_db))

        if self.memory_dir:
            candidates.append(self.memory_dir / "memory.db")

        candidates.extend(DEFAULT_DB_CANDIDATES)

        for candidate in candidates:
            if candidate and candidate.exists():
                return candidate
        return None

    def profile(self, include_memory: bool = False) -> Dict[str, object]:
        """Return Cecilia's structured profile with optional memory details."""

        data = deepcopy(_BOT_PROFILE)
        data["agent_id"] = self.agent_id
        data["aliases"] = list(self.aliases)
        if include_memory:
            data["memory_summary"] = self.memory_summary()
        return data

    def memory_summary(self) -> Dict[str, object]:
        """Summarize Cecilia's filesystem and database memory stores."""

        files_indexed = 0
        bytes_indexed = 0
        directory_exists = self.memory_dir.exists()
        if directory_exists:
            for path in self.memory_dir.rglob("*"):
                if path.is_file():
                    files_indexed += 1
                    try:
                        bytes_indexed += path.stat().st_size
                    except OSError:
                        continue

        database_path = str(self.memory_db) if isinstance(self.memory_db, Path) else None
        database_sources: Dict[str, int] = {}
        if isinstance(self.memory_db, Path) and self.memory_db.exists():
            database_sources = self._count_database_sources(self.memory_db)

        return {
            "directory": str(self.memory_dir),
            "directory_exists": directory_exists,
            "files_indexed": files_indexed,
            "bytes_indexed": bytes_indexed,
            "database_path": database_path,
            "database_sources": database_sources,
        }

    def _count_database_sources(self, db_path: Path) -> Dict[str, int]:
        """Aggregate stored memory entries by their declared source."""

        counts: Counter[str] = Counter()
        try:
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                try:
                    rows = cursor.execute(
                        "SELECT json_extract(meta, '$.source') AS source, COUNT(*) "
                        "FROM docs GROUP BY source"
                    ).fetchall()
                except sqlite3.Error:
                    return {}
        except sqlite3.Error:
            return {}

        for source, total in rows:
            key = str(source or "unknown")
            counts[key] += int(total or 0)
        return dict(counts)

    def export_profile(self, destination: str | Path, include_memory: bool = True) -> Path:
        """Write Cecilia's profile (optionally enriched with memory info) to disk."""

        payload = self.profile(include_memory=include_memory)
        target = Path(destination)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")
        return target
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
