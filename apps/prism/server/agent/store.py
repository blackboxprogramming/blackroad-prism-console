"""SQLite-backed job store for the Prism console agent."""

from __future__ import annotations

import pathlib
import sqlite3
import threading
import time
from typing import Any, Dict, List, Optional

DB = pathlib.Path("/var/lib/blackroad/jobs.sqlite")
DB.parent.mkdir(parents=True, exist_ok=True)

_lock = threading.Lock()
_conn_singleton: Optional[sqlite3.Connection] = None


def _get_conn() -> sqlite3.Connection:
    """Return the singleton SQLite connection configured for concurrency."""
    global _conn_singleton
    if _conn_singleton is None:
        conn = sqlite3.connect(DB, check_same_thread=False)
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cmd TEXT NOT NULL,
                started REAL NOT NULL,
                ended REAL,
                status TEXT NOT NULL,
                output TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_started ON jobs(started DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)"
        )
        conn.commit()
        _conn_singleton = conn
    return _conn_singleton


def new_job(cmd: str) -> int:
    """Create a new job record and return its identifier."""
    with _lock:
        conn = _get_conn()
        cur = conn.execute(
            "INSERT INTO jobs(cmd, started, status, output) VALUES(?, ?, ?, ?)",
            (cmd, time.time(), "running", ""),
        )
        conn.commit()
        return int(cur.lastrowid)


def append(job_id: int, text: str, max_bytes: int = 256 * 1024) -> None:
    """Append log output to a job while trimming to the newest ``max_bytes``."""
    if max_bytes <= 0:
        raise ValueError("max_bytes must be positive")

    with _lock:
        conn = _get_conn()
        start = -int(max_bytes)
        conn.execute(
            """
            UPDATE jobs
               SET output = substr(COALESCE(output, '') || ?, ?)
             WHERE id = ?
            """,
            (text, start, job_id),
        )
        conn.commit()


def finish(job_id: int, status: str) -> None:
    """Mark a job as finished with the provided status."""
    with _lock:
        conn = _get_conn()
        conn.execute(
            "UPDATE jobs SET ended = ?, status = ? WHERE id = ?",
            (time.time(), status, job_id),
        )
        conn.commit()


def list_jobs(limit: int = 20) -> List[Dict[str, Any]]:
    """Return the newest jobs limited by ``limit``."""
    conn = _get_conn()
    rows = conn.execute(
        """
        SELECT id, cmd, started, ended, status
          FROM jobs
         ORDER BY id DESC
         LIMIT ?
        """,
        (int(limit),),
    ).fetchall()
    return [
        {
            "id": row[0],
            "cmd": row[1],
            "started": row[2],
            "ended": row[3],
            "status": row[4],
        }
        for row in rows
    ]


def get_job(job_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a single job by identifier."""
    conn = _get_conn()
    row = conn.execute(
        """
        SELECT id, cmd, started, ended, status, output
          FROM jobs
         WHERE id = ?
        """,
        (job_id,),
    ).fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "cmd": row[1],
        "started": row[2],
        "ended": row[3],
        "status": row[4],
        "output": row[5] or "",
    }
