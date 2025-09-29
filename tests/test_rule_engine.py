from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import pytest

from policy.rules_engine import EvaluationContext, Rule, RuleMode, RuleRuntime, load_fixture, load_rule_file


RULE_DIR = Path("rules")
FIXTURE_DIR = Path("fixtures")


def _materialize_case(raw_case) -> tuple[Dict[str, Any], EvaluationContext]:
    fixture_payload: Dict[str, Any] = {}
    if raw_case.fixture:
        fixture_payload = load_fixture(FIXTURE_DIR / raw_case.fixture)
    series = raw_case.series if raw_case.series is not None else fixture_payload.get("series", [])
    series = [dict(event) for event in series]
    window = raw_case.window or fixture_payload.get("window")

    baseline = dict(fixture_payload.get("baseline", {}))
    baseline.update(raw_case.baseline or {})

    metadata = dict(fixture_payload.get("metadata", {}))
    metadata.update(raw_case.metadata or {})
    extras = dict(fixture_payload.get("extras", {}))

    event: Dict[str, Any] = {}
    if isinstance(fixture_payload.get("input"), dict):
        event.update(fixture_payload["input"])
    if raw_case.input:
        event.update(raw_case.input)
    if not event and series:
        event = dict(series[-1])

    now_value = raw_case.now or fixture_payload.get("now")
    parsed_now = None
    if now_value:
        text = now_value
        if isinstance(text, str) and text.endswith("Z"):
            text = text[:-1] + "+00:00"
        parsed_now = datetime.fromisoformat(text)
    ctx = EvaluationContext(
        series=series or [event],
        baseline=baseline,
        metadata=metadata,
        extras={**extras, **({"window": window} if window else {})},
        now_value=parsed_now,
    )
    return event, ctx


def _dict_contains(actual: Any, expected: Any) -> bool:
    if isinstance(expected, dict):
        if not isinstance(actual, dict):
            return False
        for key, value in expected.items():
            if key not in actual:
                return False
            if not _dict_contains(actual[key], value):
                return False
        return True
    if isinstance(expected, list):
        if not isinstance(actual, list):
            return False
        for item in expected:
            if isinstance(item, dict):
                if not any(_dict_contains(candidate, item) for candidate in actual):
                    return False
            else:
                if item not in actual:
                    return False
        return True
    return actual == expected


def _rule_cases():
    for path in sorted(RULE_DIR.glob("*.yaml")):
        rule, cases = load_rule_file(path)
        for case in cases:
            yield path, rule, case


@pytest.mark.parametrize("_rule_path, rule, case", list(_rule_cases()))
def test_rule_definitions(_rule_path: Path, rule: Rule, case) -> None:
    event, ctx = _materialize_case(case)
    runtime = RuleRuntime()
    result = runtime.apply(rule, event, ctx)

    assert result.triggered is case.want, f"{rule.id}/{case.name} expected {case.want}, got {result.triggered}"

    if rule.mode is RuleMode.ENFORCE:
        assert result.blocked == case.want
        if case.want:
            expected_message = rule.metadata.get("block_message") if isinstance(rule.metadata, dict) else None
            if expected_message:
                expected_message = expected_message.format(**event)
                assert result.message == expected_message
    else:
        assert result.blocked is False

    if case.expect_details:
        assert _dict_contains(result.details, case.expect_details)

    if case.want:
        assert result.violation_id
        assert runtime.notifications, "violation should enqueue notification"
    else:
        assert result.violation_id is None


def test_runtime_fail_open_on_error() -> None:
    rule = Rule(
        rule_id="TEST_OBSERVE_ERROR",
        expr="missing_field.some_method()",
        mode=RuleMode.OBSERVE,
        severity="low",
    )
    event = {}
    ctx = EvaluationContext(series=[event])
    runtime = RuleRuntime()
    result = runtime.apply(rule, event, ctx)
    assert result.blocked is False
    assert result.code is None
    assert runtime.metrics["rule_eval_error"][rule.id] == 1


def test_runtime_fail_closed_when_marked() -> None:
    rule = Rule(
        rule_id="TEST_ENFORCE_ERROR",
        expr="unknown.value > 1",
        mode=RuleMode.ENFORCE,
        severity="high",
        block_on_error=True,
        metadata={"error_message": "Blocked by policy TEST_ENFORCE_ERROR due to evaluation failure."},
    )
    ctx = EvaluationContext(series=[{}])
    runtime = RuleRuntime()
    result = runtime.apply(rule, {}, ctx)
    assert result.blocked is True
    assert result.code == "policy_eval_error"
    assert "Blocked by policy" in result.message


def test_violation_upsert_creates_stable_id() -> None:
    rule = Rule(rule_id="TEST_VIOLATION", expr="true", mode=RuleMode.ENFORCE, severity="high")
    ctx = EvaluationContext(series=[{"foo": "bar"}])
    runtime = RuleRuntime()
    event = {"foo": "bar"}
    first = runtime.apply(rule, event, ctx)
    assert first.violation_id is not None
    again = runtime.apply(rule, event, ctx)
    assert again.violation_id == first.violation_id
    assert runtime.violations
    assert len(runtime.notifications) == 2
