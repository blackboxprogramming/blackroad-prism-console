from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from typing import Tuple

DEFAULT_DB = \
    os.environ.get("BLACKROAD_DB") or \
    "/srv/blackroad-api/blackroad.db"


def is_excepted(rule_id: str, subject_type: str | None, subject_id: str | None,
                now: datetime | None = None) -> Tuple[bool, str]:
    """Return (allowed, exception_id)."""
    if not rule_id or not subject_type or not subject_id:
        return False, ""
    db_path = os.environ.get("BLACKROAD_DB", DEFAULT_DB)
    if not db_path:
        return False, ""
    moment = now or datetime.now(timezone.utc)
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    iso_now = moment.astimezone(timezone.utc).isoformat()
    try:
        conn = sqlite3.connect(db_path)
    except sqlite3.Error:
        return False, ""
    try:
        conn.row_factory = sqlite3.Row
        try:
            row = conn.execute(
                """
                SELECT id FROM exceptions
                WHERE rule_id = ?
                  AND subject_type = ?
                  AND subject_id = ?
                  AND status = 'approved'
                  AND (valid_from IS NULL OR datetime(valid_from) <= datetime(?))
                  AND (valid_until IS NULL OR datetime(valid_until) >= datetime(?))
                ORDER BY id ASC
                LIMIT 1
                """,
                (rule_id, subject_type, subject_id, iso_now, iso_now),
            ).fetchone()
        except sqlite3.Error:
            return False, ""
        if row:
            return True, str(row["id"])
        return False, ""
    finally:
        conn.close()
