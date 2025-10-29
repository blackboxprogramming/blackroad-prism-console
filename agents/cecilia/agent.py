"""Cecilia agent bridging profile metadata and memory discovery."""
from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

from bots.cecilia_bot import CECILIA_AGENT_ID, CECILIA_ALIASES, CECILIA_PROFILE


@dataclass
class CeciliaAgent:
    """Expose Cecilia's identity and surface basic memory inspection tools."""

    memory_dir: str | Path
    memory_db: Optional[str | Path] = None
    agent_id: str = field(default=CECILIA_AGENT_ID, init=False)

    def __post_init__(self) -> None:
        self.memory_path = Path(self.memory_dir)
        self.memory_db_path = None if self.memory_db is None else Path(self.memory_db)

    @property
    def aliases(self) -> Iterable[str]:
        """Return known aliases registered for Cecilia."""

        return CECILIA_ALIASES

    def profile(self) -> Dict[str, Any]:
        """Return a copy of the structured agent profile."""

        profile_copy: Dict[str, Any] = json.loads(json.dumps(CECILIA_PROFILE))
        profile_copy["memory"] = self.memory_summary()
        profile_copy["aliases"] = sorted(self.aliases)
        return profile_copy

    def memory_summary(self) -> Dict[str, Any]:
        """Summarise filesystem and database artefacts for Cecilia."""

        summary: Dict[str, Any] = {
            "directory": str(self.memory_path),
            "directory_exists": self.memory_path.is_dir(),
            "files_indexed": 0,
            "bytes_indexed": 0,
            "database_path": None,
            "database_sources": {},
        }

        if summary["directory_exists"]:
            for path in self.memory_path.rglob("*"):
                if path.is_file():
                    summary["files_indexed"] += 1
                    try:
                        summary["bytes_indexed"] += path.stat().st_size
                    except OSError:
                        continue

        db_path = self._detect_db_path()
        if db_path is not None:
            summary["database_path"] = str(db_path)
            summary["database_sources"] = self._summarise_database(db_path)

        return summary

    def export_profile(self, destination: str | Path) -> Path:
        """Write the enriched profile to ``destination`` as JSON."""

        destination_path = Path(destination)
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"agent_id": self.agent_id, "profile": self.profile()}
        destination_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return destination_path

    def _detect_db_path(self) -> Optional[Path]:
        """Locate a memory database either explicitly configured or adjacent."""

        if self.memory_db_path is not None:
            return self.memory_db_path if self.memory_db_path.exists() else None

        candidate = self.memory_path / "memory.db"
        if candidate.exists():
            return candidate

        fallback = Path("/srv/blackroad-api/memory.db")
        if fallback.exists():
            return fallback
        return None

    def _summarise_database(self, db_path: Path) -> Dict[str, int]:
        """Aggregate memory entries by source from the SQLite database."""

        counts: Dict[str, int] = {}
        try:
            with sqlite3.connect(db_path) as connection:
                cursor = connection.execute(
                    (
                        "SELECT COALESCE(source, 'unknown') AS source, COUNT(1) "
                        "FROM memory GROUP BY source"
                    )
                )
                for source, count in cursor.fetchall():
                    counts[str(source)] = int(count)
        except (sqlite3.DatabaseError, OSError):
            counts["error"] = 0
        return counts
