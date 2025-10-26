from __future__ import annotations

from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
WORKFLOW_DIR = REPO_ROOT / ".github" / "workflows"


REUSABLE_WORKFLOWS = [
    "ci.yml",
    "cli-validation.yml",
    "lint.yml",
    "test-reusable.yml",
]


def load_workflow(name: str) -> dict:
    path = WORKFLOW_DIR / name
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def trigger_block(data: dict) -> dict | list | str | None:
    if "on" in data:
        return data["on"]
    if True in data:
        return data[True]
    return None


def test_workflow_call_enabled() -> None:
    for name in REUSABLE_WORKFLOWS:
        data = load_workflow(name)
        triggers = trigger_block(data) or {}
        assert "workflow_call" in triggers, f"{name} must support workflow_call"


def test_permissions_declared() -> None:
    for name in REUSABLE_WORKFLOWS:
        data = load_workflow(name)
        permissions = data.get("permissions")
        assert isinstance(permissions, dict), f"{name} must declare explicit permissions"
        assert "contents" in permissions, f"{name} must scope contents permissions"


def test_reusable_jobs_have_steps() -> None:
    for name in REUSABLE_WORKFLOWS:
        data = load_workflow(name)
        jobs = data.get("jobs", {})
        assert jobs, f"{name} must define at least one job"
        for job_name, job in jobs.items():
            assert job.get("steps"), f"{name}:{job_name} must define steps"
