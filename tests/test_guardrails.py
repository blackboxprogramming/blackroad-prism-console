import pytest

from orchestrator.base import assert_guardrails
from orchestrator.protocols import BotResponse


def test_guardrails_missing_fields():
    bad = BotResponse(
        task_id="T1",
        summary="",
        steps=[],
        data={},
        risks=[],
        artifacts=[],
        next_actions=[],
        ok=True,
    )
    with pytest.raises(AssertionError):
        assert_guardrails(bad)
