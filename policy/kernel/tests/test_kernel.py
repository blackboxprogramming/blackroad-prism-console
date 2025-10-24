import os
import sqlite3
from datetime import datetime, timedelta, timezone

from policy.kernel.kernel import PolicyKernel


def _prepare_exception_db(path: str, rule_id: str, subject_type: str, subject_id: str):
    conn = sqlite3.connect(path)
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS exceptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_id TEXT NOT NULL,
            org_id INTEGER NOT NULL,
            subject_type TEXT NOT NULL,
            subject_id TEXT NOT NULL,
            requested_by INTEGER NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL,
            valid_from TEXT,
            valid_until TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS exception_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exception_id INTEGER NOT NULL,
            at TEXT NOT NULL,
            actor INTEGER NOT NULL,
            action TEXT NOT NULL,
            note TEXT
        );
        """
    )
    now = datetime.now(timezone.utc)
    conn.execute(
        """
        INSERT INTO exceptions
            (rule_id, org_id, subject_type, subject_id, requested_by, reason, status, valid_from, valid_until, created_at, updated_at)
        VALUES
            (?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?)
        """,
        (
            rule_id,
            1,
            subject_type,
            subject_id,
            99,
            "test",
            now.isoformat(),
            (now + timedelta(days=1)).isoformat(),
            now.isoformat(),
            now.isoformat(),
        ),
    )
    conn.commit()
    conn.close()


from policy.kernel.kernel import PolicyKernel


def test_closed_won_allow():
    pk = PolicyKernel()
    env = {
        "source": "salesforce",
        "type": "salesforce.opportunity.closed_won",
        "payload": {"opportunity": {"amount": 100000}}
    }
    result = pk.evaluate(env)
    assert result["decision"] == "ALLOW"


def test_closed_won_review_large_amount():
    pk = PolicyKernel()
    env = {
        "source": "salesforce",
        "type": "salesforce.opportunity.closed_won",
        "payload": {"opportunity": {"amount": 2_000_000}}
    }
    result = pk.evaluate(env)
    assert result["decision"] == "REVIEW"


def test_github_branch_delete_auto():
    pk = PolicyKernel()
    env = {
        "source": "github",
        "type": "github.branch.deleted",
        "payload": {
            "event": "delete",
            "ref_type": "branch",
            "ref": "refs/heads/feature/cleanup",
            "repository": {"full_name": "blackroad/prism-console", "default_branch": "main"},
        },
    }

    result = pk.evaluate(env)

    assert result["decision"] == "ALLOW"


def test_global_kill_switch():
    pk = PolicyKernel()
    pk.set_kill_switch(True)
    env = {"source": "salesforce", "type": "salesforce.opportunity.closed_won", "payload": {}}
    result = pk.evaluate(env)
    assert result["decision"] == "DENY"


def test_deny_overridden_by_exception(tmp_path):
    db_dir = tmp_path / "exc"
    db_dir.mkdir()
    db_path = db_dir / "test.db"
    _prepare_exception_db(str(db_path), "custom.rule", "repo", "blackroad/prism")
    os.environ["BLACKROAD_DB"] = str(db_path)
    try:
        pk = PolicyKernel()
        pk.policies["custom.rule"] = {"mode": "deny", "max_risk": 0}
        env = {
            "source": "github",
            "type": "custom.rule",
            "rule_id": "custom.rule",
            "subject": {"type": "repo", "id": "blackroad/prism"},
            "payload": {},
        }
        result = pk.evaluate(env)
        assert result["decision"] == "ALLOW"
        assert result["reason"].endswith("_exception")
        assert result.get("exception_id")
    finally:
        os.environ.pop("BLACKROAD_DB", None)
