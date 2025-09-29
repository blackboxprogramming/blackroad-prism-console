import sqlite3
import pathlib
import time
from typing import Dict, List, Optional

DB = pathlib.Path("/var/lib/blackroad/jobs.sqlite")
DB.parent.mkdir(parents=True, exist_ok=True)

def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS jobs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cmd TEXT, started REAL, ended REAL, status TEXT, output TEXT
    )"""
    )
    return conn

def new_job(cmd: str) -> int:
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO jobs(cmd,started,status,output) VALUES(?,?,?,?)",
            (cmd, time.time(), "running", ""),
        )
        return cur.lastrowid

def append(job_id: int, text: str) -> None:
    with _conn() as c:
        c.execute(
            "UPDATE jobs SET output=COALESCE(output,'')||? WHERE id=?",
            (text, job_id),
        )

def finish(job_id: int, status: str) -> None:
    with _conn() as c:
        c.execute(
            "UPDATE jobs SET ended=?, status=? WHERE id=?",
            (time.time(), status, job_id),
        )

def list_jobs(limit: int = 20) -> List[Dict[str, Optional[float]]]:
    with _conn() as c:
        rows = c.execute(
            "SELECT id,cmd,started,ended,status FROM jobs ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [
            dict(id=r[0], cmd=r[1], started=r[2], ended=r[3], status=r[4])
            for r in rows
        ]

def get_job(job_id: int) -> Optional[Dict[str, Optional[float]]]:
    with _conn() as c:
        r = c.execute(
            "SELECT id,cmd,started,ended,status,output FROM jobs WHERE id=?",
            (job_id,),
        ).fetchone()
        if not r:
            return None
        return dict(
            id=r[0], cmd=r[1], started=r[2], ended=r[3], status=r[4], output=r[5] or ""
        )
