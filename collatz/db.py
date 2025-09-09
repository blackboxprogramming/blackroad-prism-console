import os
import sqlite3
import time
from typing import Optional, Tuple

SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_n INTEGER NOT NULL,
    end_n   INTEGER NOT NULL,
    status  TEXT NOT NULL DEFAULT 'queued', -- queued|running|done|error
    claimed_at REAL,
    finished_at REAL
);
CREATE TABLE IF NOT EXISTS results(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    min_n INTEGER NOT NULL,
    max_n INTEGER NOT NULL,
    max_stopping_time INTEGER,
    max_excursion INTEGER,
    checked_count INTEGER,
    verified INTEGER NOT NULL, -- 0/1
    FOREIGN KEY(job_id) REFERENCES jobs(id)
);
CREATE TABLE IF NOT EXISTS anomalies(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    n0 INTEGER NOT NULL,
    reason TEXT NOT NULL,
    job_id INTEGER,
    trace_path TEXT,
    created_at REAL
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
"""


def connect(path: str):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    conn = sqlite3.connect(path, timeout=60, isolation_level=None)
    conn.execute("PRAGMA journal_mode=WAL;")
    for stmt in SCHEMA.strip().split(";"):
        if stmt.strip():
            conn.execute(stmt)
    return conn


def enqueue_chunks(conn, start_n: int, end_n: int, chunk: int):
    cur = conn.cursor()
    n = start_n
    while n <= end_n:
        cur.execute(
            "INSERT INTO jobs(start_n,end_n) VALUES(?,?)",
            (n, min(n + chunk - 1, end_n)),
        )
        n += chunk


def claim_job(conn) -> Optional[Tuple[int, int, int]]:
    cur = conn.cursor()
    cur.execute("BEGIN IMMEDIATE;")
    row = cur.execute(
        "SELECT id,start_n,end_n FROM jobs WHERE status='queued' ORDER BY id LIMIT 1"
    ).fetchone()
    if not row:
        conn.execute("COMMIT;")
        return None
    job_id, s, e = row
    conn.execute(
        "UPDATE jobs SET status='running', claimed_at=? WHERE id=?",
        (time.time(), job_id),
    )
    conn.execute("COMMIT;")
    return job_id, s, e


def finish_job(
    conn,
    job_id: int,
    verified: int,
    min_n: int,
    max_n: int,
    max_stopping_time: int,
    max_excursion: int,
    checked: int,
):
    conn.execute(
        "INSERT INTO results(job_id,min_n,max_n,max_stopping_time,max_excursion,checked_count,verified) VALUES(?,?,?,?,?,?,?)",
        (job_id, min_n, max_n, max_stopping_time, max_excursion, checked, verified),
    )
    conn.execute(
        "UPDATE jobs SET status='done', finished_at=? WHERE id=?",
        (time.time(), job_id),
    )


def record_anomaly(
    conn,
    n0: int,
    reason: str,
    job_id: Optional[int],
    trace_path: Optional[str],
):
    conn.execute(
        "INSERT INTO anomalies(n0,reason,job_id,trace_path,created_at) VALUES(?,?,?,?,?)",
        (n0, reason, job_id, trace_path, time.time()),
    )


def status(conn):
    cur = conn.cursor()
    queued = cur.execute("SELECT COUNT() FROM jobs WHERE status='queued'").fetchone()[0]
    running = cur.execute("SELECT COUNT() FROM jobs WHERE status='running'").fetchone()[0]
    done = cur.execute("SELECT COUNT(*) FROM jobs WHERE status='done'").fetchone()[0]
    return queued, running, done
