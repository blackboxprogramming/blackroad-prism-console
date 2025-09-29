"""SQLite-backed job store for the dashboard."""

from __future__ import annotations

import sqlite3
import threading
import time
from typing import Dict, List, Optional

from . import DEFAULT_DB_PATH

_MAX_OUTPUT = 256 * 1024
_lock = threading.Lock()
_conn: sqlite3.Connection | None = None


def _get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        db_path = DEFAULT_DB_PATH
        db_path.parent.mkdir(parents=True, exist_ok=True)
        _conn = sqlite3.connect(db_path, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        _init_schema(_conn)
    return _conn


def _init_schema(conn: sqlite3.Connection) -> None:
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cmd TEXT NOT NULL,
            started REAL NOT NULL,
            ended REAL,
            status TEXT NOT NULL,
            output TEXT
        )
        """
    )
    try:
        c.execute("ALTER TABLE jobs ADD COLUMN exit_code INTEGER")
    except Exception:
        pass
    c.execute("CREATE INDEX IF NOT EXISTS idx_jobs_exit ON jobs(exit_code)")
    conn.commit()


def create_job(cmd: str) -> int:
    with _lock:
        conn = _get_conn()
        now = time.time()
        cur = conn.execute(
            "INSERT INTO jobs(cmd, started, status, output, exit_code) VALUES(?,?,?,?,?)",
            (cmd, now, "running", "", None),
        )
        conn.commit()
        return int(cur.lastrowid)


def append_output(job_id: int, chunk: str) -> None:
    if not chunk:
        return
    with _lock:
        conn = _get_conn()
        row = conn.execute("SELECT output FROM jobs WHERE id=?", (job_id,)).fetchone()
        if row is None:
            return
        current = row[0] or ""
        new = (current + chunk)[-_MAX_OUTPUT:]
        conn.execute("UPDATE jobs SET output=? WHERE id=?", (new, job_id))
        conn.commit()


def finish(job_id: int, status: str, exit_code: int | None = None) -> None:
    with _lock:
        conn = _get_conn()
        conn.execute(
            "UPDATE jobs SET ended=?, status=?, exit_code=? WHERE id=?",
            (time.time(), status, exit_code, job_id),
        )
        conn.commit()


def list_jobs(limit: int = 50) -> List[Dict[str, Optional[float]]]:
    conn = _get_conn()
    rows = conn.execute(
        """
        SELECT id, cmd, started, ended, status, exit_code
        FROM jobs
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [
        {
            "id": row[0],
            "cmd": row[1],
            "started": row[2],
            "ended": row[3],
            "status": row[4],
            "exit_code": row[5],
        }
        for row in rows
    ]


def get_job(job_id: int) -> Dict[str, Optional[str]]:
    conn = _get_conn()
    row = conn.execute(
        """
        SELECT id, cmd, started, ended, status, output, exit_code
        FROM jobs
        WHERE id=?
        """,
        (job_id,),
    ).fetchone()
    if row is None:
        raise KeyError(job_id)
    return {
        "id": row[0],
        "cmd": row[1],
        "started": row[2],
        "ended": row[3],
        "status": row[4],
        "output": row[5] or "",
        "exit_code": row[6],
    }
