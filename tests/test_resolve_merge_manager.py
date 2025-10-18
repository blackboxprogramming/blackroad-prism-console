"""Tests for :mod:`agents.resolve_merge_manager`."""

from __future__ import annotations

import json
from pathlib import Path

from agents.resolve_merge_manager import ResolveMergeManager


def write_plan(path: Path, queue: list[dict]) -> None:
    path.write_text(json.dumps({"queue": queue}), encoding="utf-8")


def test_log_new_merges_records_each_once(tmp_path) -> None:
    plan_path = tmp_path / "merge_plan.json"
    log_path = tmp_path / "merge.log"
    queue = [
        {
            "number": 123,
            "state": "merged",
            "branch": "feature/alpha",
            "title": "Alpha feature",
        },
        {
            "number": 124,
            "state": "open",
            "branch": "feature/beta",
            "title": "Beta feature",
        },
        {
            "number": 125,
            "state": "merged",
            "branch": "feature/gamma",
            "title": "Gamma feature",
        },
    ]
    write_plan(plan_path, queue)

    manager = ResolveMergeManager(merge_plan=plan_path, log_file=log_path)

    entries = manager.read_merge_plan()
    seen = manager.log_new_merges(entries)

    # Calling again should not duplicate log entries.
    manager.log_new_merges(entries, seen)

    log_lines = log_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(log_lines) == 2
    assert "PR #123" in log_lines[0]
    assert "PR #125" in log_lines[1]


def test_read_merge_plan_handles_invalid_json(tmp_path) -> None:
    plan_path = tmp_path / "merge_plan.json"
    log_path = tmp_path / "merge.log"
    plan_path.write_text("not valid json", encoding="utf-8")

    manager = ResolveMergeManager(merge_plan=plan_path, log_file=log_path)

    entries = manager.read_merge_plan()

    # Invalid JSON should yield no entries and log an error.
    assert entries == []
    log_contents = log_path.read_text(encoding="utf-8")
    assert "Failed to parse merge plan" in log_contents
