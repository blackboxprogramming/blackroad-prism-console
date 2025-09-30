"""SQLite-backed helpers for rolling transcription storage."""

from __future__ import annotations

import os
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any, Dict, Optional


DB_PATH = Path(os.environ.get("BLACKROAD_DB", "blackroad.db")).resolve()
_lock = threading.RLock()
_conn: Optional[sqlite3.Connection] = None
_schema_ready = False


def _get_conn() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
    return _conn


def _ensure_schema() -> None:
    global _schema_ready
    if _schema_ready:
        return
    with _lock:
        if _schema_ready:
            return
        conn = _get_conn()
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS transcripts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              session TEXT,
              started REAL,
              ended REAL,
              text TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_transcripts_session ON transcripts(session)"
        )
        conn.commit()
        _schema_ready = True


def transcript_start(session: str) -> None:
    """Create (or reset) the rolling transcript row for *session*."""

    if not session:
        raise ValueError("session id required")
    _ensure_schema()
    with _lock:
        conn = _get_conn()
        conn.execute("DELETE FROM transcripts WHERE session=?", (session,))
        conn.execute(
            "INSERT INTO transcripts(session, started, text) VALUES(?,?,?)",
            (session, time.time(), ""),
        )
        conn.commit()


def transcript_append(session: str, chunk: str, max_bytes: int = 512 * 1024) -> None:
    """Append *chunk* to the transcript while keeping the last ``max_bytes`` bytes."""

    if not session or chunk is None:
        return
    _ensure_schema()
    with _lock:
        conn = _get_conn()
        row = conn.execute(
            "SELECT text FROM transcripts WHERE session=?", (session,)
        ).fetchone()
        if row is None:
            # If start wasn't called, create the row lazily.
            conn.execute(
                "INSERT INTO transcripts(session, started, text) VALUES(?,?,?)",
                (session, time.time(), ""),
            )
            text = ""
        else:
            text = row["text"] or ""

        text_bytes = (text + chunk).encode("utf-8")
        if max_bytes and len(text_bytes) > max_bytes:
            text_bytes = text_bytes[-max_bytes:]
            text = text_bytes.decode("utf-8", errors="ignore")
        else:
            text = text_bytes.decode("utf-8", errors="ignore")

        conn.execute(
            "UPDATE transcripts SET text=? WHERE session=?",
            (text, session),
        )
        conn.commit()


def transcript_finish(session: str) -> None:
    if not session:
        return
    _ensure_schema()
    with _lock:
        conn = _get_conn()
        conn.execute(
            "UPDATE transcripts SET ended=? WHERE session=?",
            (time.time(), session),
        )
        conn.commit()


def transcript_get(session: str) -> Optional[Dict[str, Any]]:
    if not session:
        return None
    _ensure_schema()
    conn = _get_conn()
    row = conn.execute(
        "SELECT session, started, ended, text FROM transcripts WHERE session=?",
        (session,),
    ).fetchone()
    if row is None:
        return None
    return {
        "session": row["session"],
        "started": row["started"],
        "ended": row["ended"],
        "text": row["text"] or "",
    }


__all__ = [
    "transcript_start",
    "transcript_append",
    "transcript_finish",
    "transcript_get",
]

