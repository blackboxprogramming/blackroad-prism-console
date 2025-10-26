"""Tests covering guardpack validations."""

from agents.codex._28_auditor.pipelines.scrub_pii import scrub
from agents.codex._28_auditor.pipelines.validate_policies import check


def _base_bundle() -> dict:
    return {
        "artifacts": ["Initial artifact"],
        "logs": ["Pipeline complete"],
        "metrics": {"cost_usd": 120.5, "energy_j": 1.5},
        "metadata": {
            "pii_scrubbed": False,
            "risk_topics": ["model"],
            "risk_level": "medium",
            "dataset_hashes": ["abc"],
            "references": ["paper-1"],
        },
    }


def test_detects_privacy_violation_when_raw_pii_present():
    bundle = _base_bundle()
    bundle["logs"].append("Reach me at 555-123-4567")
    ok, violations = check(bundle)
    assert not ok
    assert any(v["id"] == "PRIV-003" for v in violations)
    assert any(v["id"] == "PRIV-001" for v in violations)


def test_passes_after_scrubbing_and_metadata_present():
    bundle = _base_bundle()
    bundle["logs"].append("Reach me at 555-123-4567")
    scrubbed = scrub(bundle)
    ok, violations = check(scrubbed)
    assert ok, violations
