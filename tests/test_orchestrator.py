import time

import time

from lucidia.orchestrator import run_shards


def test_run_shards_completes_all():
    def job(shard_id: int) -> int:
        time.sleep(0.01)
        return shard_id

    results, errors = run_shards(job, num_shards=10, timebox_seconds=5)
    assert len(results) == 10
    assert errors == {}


def test_run_shards_timebox():
    def job(shard_id: int) -> int:
        if shard_id == 0:
            time.sleep(0.2)
        else:
            time.sleep(0.01)
        return shard_id

    results, errors = run_shards(job, num_shards=10, timebox_seconds=0.05)
    assert 0 not in results
    assert 0 in errors

from pathlib import Path
import json
from datetime import datetime

from orchestrator.protocols import Task
from orchestrator.orchestrator import route
from orchestrator.base import assert_guardrails
from tools import storage


def test_treasury_bot_route_appends_memory():
    memory_path = Path("orchestrator/memory.jsonl")
    if memory_path.exists():
        memory_path.unlink()
    task = Task(id="TTEST", goal="Build 13-week cash view", context={}, created_at=datetime.utcnow())
    response = route(task, "Treasury-BOT")
    assert_guardrails(response)
    lines = storage.read(str(memory_path)).strip().splitlines()
    assert len(lines) == 1
    record = json.loads(lines[0])
    assert record["task"]["id"] == "TTEST"
