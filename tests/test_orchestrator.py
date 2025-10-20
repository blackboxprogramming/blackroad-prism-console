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
from bots import BOT_REGISTRY
from orchestrator.orchestrator import Orchestrator
from orchestrator.protocols import Task


def test_orchestrator_routing(tmp_path):
    orch = Orchestrator(base_path=tmp_path, bots=BOT_REGISTRY)
    task = Task(id="T1", goal="test", context={})
    response = orch.route(task, "Treasury-BOT")
    assert "stub" not in response.summary.lower()
    log_file = tmp_path / "memory.jsonl"
    assert log_file.exists()
    artifact = tmp_path / "artifacts" / "T1" / "response.json"
    assert artifact.exists()
