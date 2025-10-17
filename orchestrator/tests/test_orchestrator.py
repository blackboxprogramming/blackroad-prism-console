from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import pytest

from orchestrator import orchestrator
from orchestrator.base import BaseBot
from orchestrator.protocols import BotResponse, Task
from orchestrator.slo import SLO, SLO_CATALOG


class DemoBot(BaseBot):
    """Demonstration bot used for integration tests."""

    def run(self, task: Task) -> BotResponse:
        return BotResponse(
            task_id=task.id,
            summary="Resolved request",
            steps=["look up context"],
            data={"result": 42},
            risks=["low"],
            artifacts=["reports/demo.md"],
            next_actions=["notify customer"],
            ok=True,
        )


def test_route_records_trace_and_storage(monkeypatch: pytest.MonkeyPatch) -> None:
    records: List[Dict[str, Any]] = []
    traces: List[str] = []
    scrubbed_contexts: List[Any] = []

    monkeypatch.setattr(orchestrator, 'available_bots', lambda: {'demo': DemoBot})

    monkeypatch.setattr(orchestrator.enforcer, 'check_task', lambda task: [])
    monkeypatch.setattr(orchestrator.enforcer, 'check_response', lambda bot, resp: [])
    monkeypatch.setattr(orchestrator.enforcer, 'enforce_or_raise', lambda violations: None)

    def fake_scrub(payload: Any) -> Any:
        scrubbed_contexts.append(payload)
        if isinstance(payload, dict) and 'task_id' in payload:
            clean = dict(payload)
            clean['data'] = {'sanitized': True}
            return clean
        if isinstance(payload, dict):
            return {k: '[scrubbed]' for k in payload}
        return '[scrubbed]'

    monkeypatch.setattr(orchestrator.redaction, 'scrub', fake_scrub)
    monkeypatch.setattr(orchestrator.lineage, 'start_trace', lambda task_id: 'trace-123')
    monkeypatch.setattr(orchestrator.lineage, 'finalize', lambda trace_id: traces.append(trace_id))
    monkeypatch.setattr(orchestrator.storage, 'write', lambda path, record: records.append({'path': path, 'record': record}))
    monkeypatch.setattr(orchestrator.settings, 'FORBIDDEN_BOTS', [])

    monkeypatch.setitem(SLO_CATALOG, 'demo', SLO(name='demo', p50_ms=50, p95_ms=120, max_mem_mb=256))

    task = Task(id='task-1', goal='demo goal', context={'secret': 'value'}, created_at=datetime.utcnow())
    response = orchestrator.route(task, 'demo')

    assert response.data == {'sanitized': True}
    assert response.slo_name == 'demo'
    assert response.p50_target == 50
    assert traces == ['trace-123']

    assert records, 'expected storage.write to be invoked'
    record = records[0]
    assert Path(record['path']).name == 'memory.jsonl'
    assert record['record']['bot'] == 'demo'
    assert record['record']['trace_id'] == 'trace-123'
    assert record['record']['task']['goal'] == 'demo goal'

    # Ensure context and response were sent through the scrubber
    assert any(isinstance(item, dict) and 'secret' in item for item in scrubbed_contexts)


def test_route_raises_for_unknown_bot(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(orchestrator, 'available_bots', lambda: {})
    task = Task(id='task-404', goal='ghost', context=None, created_at=datetime.utcnow())
    with pytest.raises(ValueError):
        orchestrator.route(task, 'missing')
