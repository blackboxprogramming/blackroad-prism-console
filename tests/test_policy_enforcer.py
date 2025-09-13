from datetime import datetime
from pathlib import Path

import pytest

import settings
from orchestrator.protocols import BotResponse, Task
from policy import enforcer


def test_task_and_response_violations(tmp_path: Path):
    task = Task(id="T1", goal="delete records", context={"approved": False}, created_at=datetime.utcnow())
    viols = enforcer.check_task(task)
    assert "TASK_MISSING_APPROVAL" in viols
    with pytest.raises(enforcer.BotExecutionError):
        enforcer.enforce_or_raise(viols)

    big = tmp_path / "big.bin"
    big.write_bytes(b"0" * (settings.MAX_ARTIFACT_MB * 1024 * 1024 + 1))
    resp = BotResponse(
        task_id="T1",
        summary="KPIs",
        steps=["s"],
        data={},
        risks=[],
        artifacts=[str(big)],
        next_actions=[],
        ok=True,
    )
    viols = enforcer.check_response("SomeBot", resp)
    assert "RESP_MISSING_RISKS" in viols
    assert "RESP_MISSING_KPIS" in viols
    assert "RESP_ARTIFACT_TOO_LARGE" in viols
    with pytest.raises(enforcer.BotExecutionError):
        enforcer.enforce_or_raise(viols)
