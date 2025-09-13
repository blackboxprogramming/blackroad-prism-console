import os
from datetime import datetime, timedelta

from hitl import queue, assign


def setup_queue(tmp_path, monkeypatch):
    monkeypatch.setenv("HITL_QUEUE_FILE", str(tmp_path / "queue.jsonl"))
    monkeypatch.setenv("HITL_ID_FILE", str(tmp_path / "id.txt"))
    monkeypatch.setenv("HITL_REVIEWERS_FILE", str(tmp_path / "reviewers.yaml"))
    (tmp_path / "reviewers.yaml").write_text("security:\n  reviewers: ['A','B']\n  sla_hours: 1\n")
    item = queue.enqueue("T1", "a.json", "security", "U", [])
    return item


def test_auto_assign_and_sla(tmp_path, monkeypatch):
    item = setup_queue(tmp_path, monkeypatch)
    assign.auto_assign("security")
    items = queue.list_items()
    assert items[0].reviewers
    report = assign.sla_report(now=datetime.utcnow() + timedelta(hours=2))
    assert report[0][1] < 0
