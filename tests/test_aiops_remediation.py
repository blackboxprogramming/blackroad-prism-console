import os
from pathlib import Path

from aiops import remediation

CORR = [{"kind": "brownout", "matched": {"healthchecks": {"service": "CoreAPI"}}}]


def test_plan_and_execute(tmp_path: Path):
    plan = remediation.plan(CORR, artifacts_dir=tmp_path)
    assert plan["actions"]
    plan_path = tmp_path / "aiops" / "plan.json"
    assert plan_path.exists()
    res = remediation.execute(plan_path, dry_run=True, artifacts_dir=tmp_path)
    assert res["results"][0]["status"] == "dry-run"


def test_execute_blocked(tmp_path: Path, monkeypatch):
    plan = remediation.plan(CORR, artifacts_dir=tmp_path)
    plan_path = tmp_path / "aiops" / "plan.json"
    monkeypatch.setenv("AIOPS_BLOCK_REMEDIATION", "1")
    res = remediation.execute(plan_path, dry_run=False, artifacts_dir=tmp_path)
    assert res["blocked"]
    assert res["results"][0]["status"] == "blocked"
