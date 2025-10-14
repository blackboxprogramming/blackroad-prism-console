from policy.exceptions.responses import build_policy_violation_error


def test_policy_violation_payload_contains_hint_and_metadata():
    payload = build_policy_violation_error(
        rule_id="MIRROR_CLASS_LIMIT",
        reason="classification_block",
        message="Mirroring blocked for non-public repository.",
        subject_type="repo",
        subject_id="acme/web",
        org_id="acme",
    )
    error = payload["error"]
    assert error["rule_id"] == "MIRROR_CLASS_LIMIT"
    assert error["docs_url"].endswith("mirror_class_limit")
    assert error["owners"]
    hint = error["request_exception_hint"]
    assert hint.startswith("/exception rule=MIRROR_CLASS_LIMIT")
    assert "subject=repo:acme/web" in hint
    assert 'reason="classification_block"' in hint
