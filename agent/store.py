"""SQLite-backed job store for tracking remote executions."""

from __future__ import annotations

import os
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

_DB_ENV = os.getenv("BLACKROAD_JOBS_DB")
if _DB_ENV:
    DB_PATH = Path(_DB_ENV)
else:
    DB_PATH = Path(__file__).resolve().parent / "jobs.sqlite3"

_LOCK = threading.RLock()
_INITIALIZED = False


def _connect() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH, check_same_thread=False)


def _ensure_init() -> None:
    global _INITIALIZED
    if _INITIALIZED:
        return
    with _LOCK:
        if _INITIALIZED:
            return
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = _connect()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    command TEXT NOT NULL,
                    status TEXT NOT NULL,
                    log TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    finished_at TEXT,
                    pid INTEGER,
                    log_path TEXT,
                    pidfile TEXT
                )
                """
            )
            conn.commit()
            _INITIALIZED = True
        finally:
            conn.close()


def _now() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def new_job(command: str) -> int:
    """Insert a new job record and return its id."""

    _ensure_init()
    now = _now()
    with _LOCK:
        conn = _connect()
        try:
            cur = conn.execute(
                "INSERT INTO jobs (command, status, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (command, "starting", now, now),
            )
            conn.commit()
            return int(cur.lastrowid)
        finally:
            conn.close()


def mark_running(
    jid: int,
    *,
    pid: Optional[int] = None,
    log_path: Optional[str] = None,
    pidfile: Optional[str] = None,
) -> None:
    """Mark an existing job as running and record remote metadata."""

    _ensure_init()
    now = _now()
    with _LOCK:
        conn = _connect()
        try:
            conn.execute(
                """
                UPDATE jobs
                   SET status = ?,
                       pid = ?,
                       log_path = ?,
                       pidfile = ?,
                       updated_at = ?
                 WHERE id = ?
                """,
                ("running", pid, log_path, pidfile, now, jid),
            )
            conn.commit()
        finally:
            conn.close()


def append(jid: int, chunk: str) -> None:
    """Append ``chunk`` to the stored log for ``jid``."""

    _ensure_init()
    now = _now()
    with _LOCK:
        conn = _connect()
        try:
            conn.execute(
                "UPDATE jobs SET log = COALESCE(log, '') || ?, updated_at = ? WHERE id = ?",
                (chunk, now, jid),
            )
            conn.commit()
        finally:
            conn.close()


def finish(jid: int, status: str) -> None:
    """Update the final status for ``jid`` and stamp completion time."""

    _ensure_init()
    now = _now()
    with _LOCK:
        conn = _connect()
        try:
            conn.execute(
                "UPDATE jobs SET status = ?, finished_at = ?, updated_at = ? WHERE id = ?",
                (status, now, now, jid),
            )
            conn.commit()
        finally:
            conn.close()


def get(jid: int) -> Optional[Dict[str, Any]]:
    """Return a single job row as a dict."""

    _ensure_init()
    conn = _connect()
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (jid,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def list_jobs(limit: int = 50) -> list[Dict[str, Any]]:
    """Return the most recent jobs, newest first."""

    _ensure_init()
    conn = _connect()
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            "SELECT * FROM jobs ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
