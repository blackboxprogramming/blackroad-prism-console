"""SQLite backed persistence for the collaboration presence bus."""
from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, Iterator, List, Mapping, Optional

_DEFAULT_DB_PATH = Path(os.environ.get("COLLAB_DB_PATH", "var/collab_bus.sqlite"))


@dataclass(frozen=True)
class PresenceRecord:
    agent: str
    event: str
    ts: float
    metadata: Mapping[str, Any]


class CollabStore:
    """High level wrapper around SQLite for collaboration state."""

    def __init__(self, path: Optional[Path | str] = None) -> None:
        self._path = Path(path) if path else _DEFAULT_DB_PATH
        self._lock = threading.RLock()
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with self._connection() as conn:
            self._apply_schema(conn)

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        with self._lock:
            conn = sqlite3.connect(self._path)
            conn.row_factory = sqlite3.Row
            try:
                yield conn
            finally:
                conn.commit()
                conn.close()

    @staticmethod
    def _apply_schema(conn: sqlite3.Connection) -> None:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS presence_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent TEXT NOT NULL,
                event TEXT NOT NULL,
                ts REAL NOT NULL,
                metadata TEXT DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS focus_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent TEXT NOT NULL,
                file TEXT,
                branch TEXT,
                ts REAL NOT NULL,
                metadata TEXT DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS review_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent TEXT NOT NULL,
                subject TEXT NOT NULL,
                decision TEXT NOT NULL,
                ts REAL NOT NULL,
                metadata TEXT DEFAULT '{}'
            );
            """
        )

    def record_presence(self, agent: str, event: str, metadata: Optional[Mapping[str, Any]] = None) -> None:
        self._insert(
            "INSERT INTO presence_events(agent, event, ts, metadata) VALUES(?,?,?,?)",
            (agent, event, time.time(), json.dumps(metadata or {})),
        )

    def record_focus(self, agent: str, file: str | None, branch: str | None, metadata: Optional[Mapping[str, Any]] = None) -> None:
        self._insert(
            "INSERT INTO focus_events(agent, file, branch, ts, metadata) VALUES(?,?,?,?,?)",
            (agent, file, branch, time.time(), json.dumps(metadata or {})),
        )

    def record_decision(self, agent: str, subject: str, decision: str, metadata: Optional[Mapping[str, Any]] = None) -> None:
        self._insert(
            "INSERT INTO review_decisions(agent, subject, decision, ts, metadata) VALUES(?,?,?,?,?)",
            (agent, subject, decision, time.time(), json.dumps(metadata or {})),
        )

    def _insert(self, query: str, params: Iterable[Any]) -> None:
        with self._connection() as conn:
            conn.execute(query, tuple(params))

    def online_agents(self, horizon_s: int = 90) -> List[str]:
        cutoff = time.time() - horizon_s
        query = "SELECT DISTINCT agent FROM presence_events WHERE ts >= ?"
        with self._connection() as conn:
            rows = conn.execute(query, (cutoff,)).fetchall()
        return sorted({row["agent"] for row in rows})

    def unresolved_decisions(self, horizon_s: int = 24 * 3600) -> List[PresenceRecord]:
        cutoff = time.time() - horizon_s
        query = (
            "SELECT agent, subject, decision, ts, metadata FROM review_decisions "
            "WHERE ts >= ? AND decision NOT IN ('approved', 'rejected')"
        )
        with self._connection() as conn:
            rows = conn.execute(query, (cutoff,)).fetchall()
        records: List[PresenceRecord] = []
        for row in rows:
            meta = json.loads(row["metadata"] or "{}")
            meta.setdefault("subject", row["subject"])
            records.append(
                PresenceRecord(
                    agent=row["agent"],
                    event=row["decision"],
                    ts=row["ts"],
                    metadata=meta,
                )
            )
        return records

    def most_recent_focus(self, limit: int = 25) -> List[PresenceRecord]:
        query = "SELECT agent, file, branch, ts, metadata FROM focus_events ORDER BY ts DESC LIMIT ?"
        with self._connection() as conn:
            rows = conn.execute(query, (limit,)).fetchall()
        records: List[PresenceRecord] = []
        for row in rows:
            meta = json.loads(row["metadata"] or "{}")
            meta.update({"file": row["file"], "branch": row["branch"]})
            records.append(PresenceRecord(agent=row["agent"], event="focus", ts=row["ts"], metadata=meta))
        return records

    def snapshot(self) -> Dict[str, Any]:
        """Return a shape consumable by dashboards and status exporters."""
        online = self.online_agents()
        focus = self.most_recent_focus()
        decisions = self.unresolved_decisions()
        return {
            "online": online,
            "recent_focus": [record.metadata | {"agent": record.agent, "ts": record.ts} for record in focus],
            "unresolved_decisions": [
                record.metadata | {"agent": record.agent, "state": record.event, "ts": record.ts}
                for record in decisions
            ],
        }

    def export_markdown(self) -> str:
        snapshot = self.snapshot()
        lines = ["# Collaboration Status", ""]
        lines.append(f"Last updated: {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())} UTC")
        lines.append("")
        lines.append("## Online Agents")
        if snapshot["online"]:
            for agent in snapshot["online"]:
                lines.append(f"- {agent}")
        else:
            lines.append("- _No active sessions_")
        lines.append("")
        lines.append("## Recent Focus")
        if snapshot["recent_focus"]:
            for entry in snapshot["recent_focus"]:
                file = entry.get("file") or "(workspace)"
                branch = entry.get("branch") or "unknown"
                lines.append(
                    f"- **{entry['agent']}** on `{file}` @ `{branch}` ({_ago(entry['ts'])})"
                )
        else:
            lines.append("- _No editor telemetry in window_")
        lines.append("")
        lines.append("## Unresolved Reviews")
        if snapshot["unresolved_decisions"]:
            for entry in snapshot["unresolved_decisions"]:
                subject = entry.get("subject") or entry.get("id") or "discussion"
                state = entry.get("state")
                lines.append(
                    f"- **{entry['agent']}**: {subject} → {state} ({_ago(entry['ts'])})"
                )
        else:
            lines.append("- _No pending approvals_")
        lines.append("")
        return "\n".join(lines)

    def has_discussion(self, subject: str, horizon_s: int = 7 * 24 * 3600) -> bool:
        cutoff = time.time() - horizon_s
        query = "SELECT 1 FROM review_decisions WHERE ts >= ? AND subject = ? LIMIT 1"
        with self._connection() as conn:
            row = conn.execute(query, (cutoff, subject)).fetchone()
        if row:
            return True
        query_meta = (
            "SELECT 1 FROM review_decisions WHERE ts >= ? AND json_extract(metadata, '$.subject') = ? LIMIT 1"
        )
        with self._connection() as conn:
            row = conn.execute(query_meta, (cutoff, subject)).fetchone()
        return bool(row)


def _ago(ts: float) -> str:
    delta = max(0, int(time.time() - ts))
    if delta < 60:
        return f"{delta}s ago"
    if delta < 3600:
        return f"{delta // 60}m ago"
    if delta < 86400:
        return f"{delta // 3600}h ago"
    return f"{delta // 86400}d ago"
