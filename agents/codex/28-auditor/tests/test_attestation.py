"""Tests for minting attestation receipts."""

from agents.codex._28_auditor.pipelines.mint_receipt import (
    TARGET_JOULES_PER_REPORT,
    mint,
)


def test_mint_receipt_contains_expected_sections():
    bundle = {
        "artifacts": [{"bundle": "demo"}],
        "logs": ["All good"],
        "metrics": {"energy_j": 1.2},
        "metadata": {"reviewer": "auditor@example.com"},
        "hashes": {"bundle": "hash123"},
    }

    receipt = mint(bundle, ok=True, violations=[])

    assert receipt["policy_pass"] is True
    assert receipt["hashes"]["bundle"] == "hash123"
    assert receipt["outputs"]["artifacts"] == 1
    assert receipt["energy"]["actual_joules"] == 1.2
    assert receipt["energy"]["target_joules"] == TARGET_JOULES_PER_REPORT
    assert receipt["energy"]["within_target"] is True
    assert receipt["violations"] == []
    assert receipt["inputs"]["reviewer"] == "auditor@example.com"
    assert receipt["receipt_id"]
