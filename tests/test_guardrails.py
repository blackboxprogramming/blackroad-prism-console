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
from tools import web_search


def test_web_search_stub():
    with pytest.raises(NotImplementedError):
        web_search.search("test")
