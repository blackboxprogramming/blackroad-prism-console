"""SQLite helpers for policy exceptions."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
import sqlite3
import uuid
from typing import Any, Dict, Optional, Tuple

OPEN_STATUSES = ("pending", "approved")


@dataclass
class ExceptionRecord:
    """Row representation returned by helpers."""

    id: str
    rule_id: str
    org_id: str
    subject_type: str
    subject_id: str
    status: str
    reason: str | None
    requested_by: str | None
    valid_until: str | None
    decided_by: str | None
    decided_at: str | None
    created_at: str
    updated_at: str

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "ExceptionRecord":
        return cls(
            id=row["id"],
            rule_id=row["rule_id"],
            org_id=row["org_id"],
            subject_type=row["subject_type"],
            subject_id=row["subject_id"],
            status=row["status"],
            reason=row["reason"],
            requested_by=row["requested_by"],
            valid_until=row["valid_until"],
            decided_by=row["decided_by"],
            decided_at=row["decided_at"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "rule_id": self.rule_id,
            "org_id": self.org_id,
            "subject_type": self.subject_type,
            "subject_id": self.subject_id,
            "status": self.status,
            "reason": self.reason,
            "requested_by": self.requested_by,
            "valid_until": self.valid_until,
            "decided_by": self.decided_by,
            "decided_at": self.decided_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


def ensure_schema(conn: sqlite3.Connection) -> None:
    """Create the ``exceptions`` tables and triggers if missing."""

    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS exceptions (
            id TEXT PRIMARY KEY,
            rule_id TEXT NOT NULL,
            org_id TEXT NOT NULL,
            subject_type TEXT NOT NULL,
            subject_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            reason TEXT,
            requested_by TEXT,
            valid_until TEXT,
            decided_by TEXT,
            decided_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_exceptions_lookup
            ON exceptions (rule_id, org_id, subject_type, subject_id);

        CREATE TRIGGER IF NOT EXISTS exceptions_no_dupe
        BEFORE INSERT ON exceptions
        FOR EACH ROW
        BEGIN
          SELECT
            CASE
              WHEN EXISTS (
                SELECT 1 FROM exceptions
                WHERE rule_id = NEW.rule_id
                  AND org_id = NEW.org_id
                  AND subject_type = NEW.subject_type
                  AND subject_id = NEW.subject_id
                  AND status IN ('pending', 'approved')
              )
              THEN RAISE(ABORT, 'duplicate open exception')
            END;
        END;

        CREATE TABLE IF NOT EXISTS exception_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exception_id TEXT NOT NULL,
            event TEXT NOT NULL,
            actor TEXT,
            slack_user_id TEXT,
            message_ts TEXT,
            details TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_exception_audit_exception
            ON exception_audit (exception_id);
        """
    )
    conn.commit()


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _to_iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat()


def _row_to_record(row: sqlite3.Row | None) -> Optional[ExceptionRecord]:
    if row is None:
        return None
    return ExceptionRecord.from_row(row)


def get_exception(conn: sqlite3.Connection, exc_id: str) -> Optional[Dict[str, Any]]:
    row = conn.execute(
        "SELECT * FROM exceptions WHERE id = ?",
        (exc_id,),
    ).fetchone()
    record = _row_to_record(row)
    return record.to_dict() if record else None


def _fetch_existing(
    conn: sqlite3.Connection,
    rule_id: str,
    org_id: str,
    subject_type: str,
    subject_id: str,
) -> Optional[ExceptionRecord]:
    row = conn.execute(
        """
        SELECT * FROM exceptions
        WHERE rule_id = ? AND org_id = ? AND subject_type = ? AND subject_id = ?
          AND status IN ('pending', 'approved')
        ORDER BY datetime(updated_at) DESC
        LIMIT 1
        """,
        (rule_id, org_id, subject_type, subject_id),
    ).fetchone()
    return _row_to_record(row)


def create_exception(
    conn: sqlite3.Connection,
    *,
    rule_id: str,
    org_id: str,
    subject_type: str,
    subject_id: str,
    reason: str | None = None,
    requested_by: str | None = None,
    valid_until: Optional[datetime] = None,
) -> Tuple[Dict[str, Any], bool]:
    """Insert an exception row and return (record, duplicate)."""

    exc_id = uuid.uuid4().hex
    now = _utc_now()
    valid_until_iso = _to_iso(valid_until)
    try:
        conn.execute(
            """
            INSERT INTO exceptions (
                id, rule_id, org_id, subject_type, subject_id,
                status, reason, requested_by, valid_until, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
            """,
            (
                exc_id,
                rule_id,
                org_id,
                subject_type,
                subject_id,
                reason,
                requested_by,
                valid_until_iso,
                now,
                now,
            ),
        )
        conn.commit()
        record = get_exception(conn, exc_id)
        return record or {}, False
    except sqlite3.IntegrityError as exc:
        conn.rollback()
        if "duplicate open exception" not in str(exc).lower():
            raise
        existing = _fetch_existing(conn, rule_id, org_id, subject_type, subject_id)
        if not existing:
            raise
        return existing.to_dict(), True


def _log_audit(
    conn: sqlite3.Connection,
    *,
    exception_id: str,
    event: str,
    actor: str | None = None,
    slack_user_id: str | None = None,
    message_ts: str | None = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    payload = json.dumps(details or {}, separators=(",", ":"))
    conn.execute(
        """
        INSERT INTO exception_audit (
            exception_id, event, actor, slack_user_id, message_ts, details
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        (exception_id, event, actor, slack_user_id, message_ts, payload),
    )


def approve_exception(
    conn: sqlite3.Connection,
    exc_id: str,
    *,
    actor: str | None = None,
    valid_until: Optional[datetime] = None,
    slack_user_id: str | None = None,
    message_ts: str | None = None,
    button: str | None = None,
) -> Optional[Dict[str, Any]]:
    valid_until_iso = _to_iso(valid_until)
    stamp = _utc_now()
    conn.execute(
        """
        UPDATE exceptions
        SET status = 'approved',
            valid_until = COALESCE(?, valid_until),
            decided_by = ?,
            decided_at = ?,
            updated_at = ?
        WHERE id = ?
        """,
        (valid_until_iso, actor, stamp, stamp, exc_id),
    )
    record = get_exception(conn, exc_id)
    if record:
        _log_audit(
            conn,
            exception_id=exc_id,
            event="approve",
            actor=actor,
            slack_user_id=slack_user_id,
            message_ts=message_ts,
            details={"button": button, "valid_until": valid_until_iso},
        )
        conn.commit()
    return record


def deny_exception(
    conn: sqlite3.Connection,
    exc_id: str,
    *,
    actor: str | None = None,
    reason: str | None = None,
    slack_user_id: str | None = None,
    message_ts: str | None = None,
    button: str | None = None,
) -> Optional[Dict[str, Any]]:
    stamp = _utc_now()
    conn.execute(
        """
        UPDATE exceptions
        SET status = 'denied',
            decided_by = ?,
            decided_at = ?,
            reason = COALESCE(?, reason),
            updated_at = ?
        WHERE id = ?
        """,
        (actor, stamp, reason, stamp, exc_id),
    )
    record = get_exception(conn, exc_id)
    if record:
        _log_audit(
            conn,
            exception_id=exc_id,
            event="deny",
            actor=actor,
            slack_user_id=slack_user_id,
            message_ts=message_ts,
            details={"button": button, "reason": reason},
        )
        conn.commit()
    return record
