from orchestrator.protocols import BotResponse
from safety import policy


def _resp(**kwargs):
    defaults = dict(
        task_id="T0",
        summary="ok",
        steps=[],
        data={},
        risks=[],
        artifacts=[],
        next_actions=[],
        ok=True,
    )
    defaults.update(kwargs)
    return BotResponse(**defaults)


def test_violation_fires():
    resp = _resp(risks=[])
    codes = policy.evaluate(resp, ["baseline"])
    assert "SAF_NO_RISKS" in codes


def test_pack_composition():
    resp = _resp(risks=["phi"], summary="SSN 123")
    codes = policy.evaluate(resp, ["regulated"])
    assert "SAF_PHI_LEAK" in codes
    codes = policy.evaluate(resp, ["public_company"])
    assert "SAF_PHI_LEAK" in codes
