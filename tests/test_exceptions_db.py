from datetime import datetime, timedelta, timezone
import sqlite3

from policy.exceptions import (
    approve_exception,
    create_exception,
    deny_exception,
    ensure_schema,
    get_exception,
)


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    return conn


def test_duplicate_exception_returns_existing_id():
    conn = _conn()
    first, dup = create_exception(
        conn,
        rule_id="MIRROR_CLASS_LIMIT",
        org_id="acme",
        subject_type="repo",
        subject_id="acme/web",
        reason="Need to sync overnight",
        requested_by="alice",
    )
    assert dup is False
    second, dup2 = create_exception(
        conn,
        rule_id="MIRROR_CLASS_LIMIT",
        org_id="acme",
        subject_type="repo",
        subject_id="acme/web",
        reason="retry",
        requested_by="alice",
    )
    assert dup2 is True
    assert second["id"] == first["id"]


def test_approve_and_deny_update_status():
    conn = _conn()
    record, _ = create_exception(
        conn,
        rule_id="MIRROR_CLASS_LIMIT",
        org_id="acme",
        subject_type="repo",
        subject_id="acme/api",
        reason="Investigating",
        requested_by="bob",
    )
    exc_id = record["id"]
    until = datetime.now(timezone.utc) + timedelta(hours=24)
    approved = approve_exception(
        conn,
        exc_id,
        actor="approver",
        valid_until=until,
        slack_user_id="U123",
        message_ts="1700000000.0",
        button="approve24",
    )
    assert approved is not None
    assert approved["status"] == "approved"
    assert approved["decided_by"] == "approver"
    assert approved["valid_until"] is not None

    denied = deny_exception(
        conn,
        exc_id,
        actor="approver",
        reason="expired",
        slack_user_id="U123",
        message_ts="1700000001.0",
        button="deny",
    )
    assert denied is not None
    assert denied["status"] == "denied"
    assert denied["reason"] == "expired"

    final = get_exception(conn, exc_id)
    assert final is not None
    assert final["status"] == "denied"
