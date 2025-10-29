"""Python interface for interacting with the Cecilia agent profile and memory."""

from __future__ import annotations

import json
import os
import sqlite3
from collections import Counter
from copy import deepcopy
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional

from bots.cecilia_bot import (
    CECILIA_AGENT_ID,
    CECILIA_ALIASES as _BOT_ALIASES,
    CECILIA_PROFILE as _BOT_PROFILE,
)

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
