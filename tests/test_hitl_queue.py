import os

from hitl import queue


def test_enqueue_and_approve(tmp_path, monkeypatch):
    qfile = tmp_path / "queue.jsonl"
    idfile = tmp_path / "id.txt"
    monkeypatch.setenv("HITL_QUEUE_FILE", str(qfile))
    monkeypatch.setenv("HITL_ID_FILE", str(idfile))
    item = queue.enqueue("T1", "artifact.json", "security", "U_REQ", [])
    assert item.id.startswith("H")
    queue.approve(item.id, "U_SEC", "ok")
    items = queue.list_items("approved")
    assert items[0].notes == ["ok"]
