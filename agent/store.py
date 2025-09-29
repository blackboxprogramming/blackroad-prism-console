"""SQLite-backed job store for the dashboard."""

from __future__ import annotations

import os
import sqlite3
import threading
import time
from pathlib import Path

_DB_PATH = Path(os.getenv("BLACKROAD_DASHBOARD_DB", "/tmp/blackroad_dashboard.db"))
_LOCK = threading.Lock()


def _ensure_schema() -> None:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(_DB_PATH) as conn:
        conn.executescript(
            """
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                command TEXT NOT NULL,
                status TEXT NOT NULL,
                log TEXT DEFAULT '',
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL,
                finished_at REAL
            );
            """
        )


_ensure_schema()


def _execute(sql: str, params: tuple[object, ...]) -> None:
    with sqlite3.connect(_DB_PATH) as conn:
        conn.execute(sql, params)
        conn.commit()


def new_job(command: str) -> int:
    """Record a newly started job and return its identifier."""

    now = time.time()
    with _LOCK, sqlite3.connect(_DB_PATH) as conn:
        cur = conn.execute(
            "INSERT INTO jobs(command, status, log, created_at, updated_at) VALUES(?,?,?,?,?)",
            (command, "running", "", now, now),
        )
        conn.commit()
        return int(cur.lastrowid)


def append(jid: int, data: str) -> None:
    """Append log ``data`` to the job's aggregated log buffer."""

    if not data:
        return
    now = time.time()
    with _LOCK:
        _execute(
            "UPDATE jobs SET log = COALESCE(log, '') || ?, updated_at=? WHERE id=?",
            (data, now, jid),
        )


def finish(jid: int, status: str) -> None:
    """Mark ``jid`` as finished with the provided ``status``."""

    now = time.time()
    with _LOCK:
        _execute(
            "UPDATE jobs SET status=?, finished_at=?, updated_at=? WHERE id=?",
            (status, now, now, jid),
        )
