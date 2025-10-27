from __future__ import annotations

from pathlib import Path

from agents.codex._34_integrator.pipelines.queue_io import DurableQueue


def test_durable_queue_persists_items(tmp_path) -> None:
    queue_path = tmp_path / "queue.jsonl"
    queue = DurableQueue(queue_path)

    queue.enqueue({"id": 1})
    queue.enqueue({"id": 2})

    assert len(queue) == 2
    assert queue.peek(1)[0]["id"] == 1

    restored = DurableQueue(queue_path)
    assert len(restored) == 2

    batch = restored.dequeue(1)
    assert batch[0]["id"] == 1
    assert len(restored) == 1
