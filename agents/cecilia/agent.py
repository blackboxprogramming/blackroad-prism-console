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

        for candidate in candidates:
            if candidate and candidate.exists():
                return candidate
        return None

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
