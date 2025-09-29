"""SQLite-backed transcript persistence for streaming sessions."""
from __future__ import annotations

import sqlite3
import threading
import time
from pathlib import Path
from typing import Any, Dict, Optional

_DB_PATH = Path.home() / ".blackroad"
_DB_PATH.mkdir(parents=True, exist_ok=True)
_DB_FILE = _DB_PATH / "transcripts.sqlite3"

_lock = threading.RLock()
_conn = sqlite3.connect(_DB_FILE, check_same_thread=False)
_conn.execute("PRAGMA journal_mode=WAL")
_conn.execute(
    """
    CREATE TABLE IF NOT EXISTS transcripts(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session TEXT,
      started REAL,
      ended REAL,
      text TEXT
    )
    """
)
_conn.execute(
    "CREATE INDEX IF NOT EXISTS idx_transcripts_session ON transcripts(session)"
)
_conn.commit()


def transcript_start(session: str) -> None:
    with _lock:
        _conn.execute(
            "INSERT INTO transcripts(session, started, text) VALUES(?,?,?)",
            (session, time.time(), ""),
        )
        _conn.commit()


def transcript_append(session: str, chunk: str, max_bytes: int = 512 * 1024) -> None:
    with _lock:
        _conn.execute(
            """
            UPDATE transcripts
               SET text = substr(COALESCE(text, '') || ?, ?)
             WHERE session=?
            """,
            (chunk, -max_bytes, session),
        )
        _conn.commit()


def transcript_finish(session: str) -> None:
    with _lock:
        _conn.execute(
            "UPDATE transcripts SET ended=? WHERE session=?",
            (time.time(), session),
        )
        _conn.commit()


def transcript_get(session: str) -> Optional[Dict[str, Any]]:
    cur = _conn.execute(
        "SELECT session, started, ended, text FROM transcripts WHERE session=?",
        (session,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        "session": row[0],
        "started": row[1],
        "ended": row[2],
        "text": row[3] or "",
    }
