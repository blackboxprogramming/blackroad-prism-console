"""Unit tests for the Lucidia reasoning duet components."""

from __future__ import annotations

import json
from pathlib import Path

from lucidia.duet import (
    ArbiterDecision,
    DuetLogger,
    LocalGenerator,
    MemoryStore,
    ProposeInput,
    Proposal,
    RuleSet,
    TaskDescriptor,
    ValidationResult,
    decide,
    validate,
)
from lucidia.duet.generator import default_prompt_builder


def _dummy_backend(_: str) -> dict[str, object]:
    return {
        "summary": "Plan covers SEC Form ADV and state timelines.",
        "rationale": [
            "Recall ops/NGINX-ok:2025-08-22 uptime fact.",
            "List compliance filing requirements.",
        ],
        "plan": [
            "Draft Form ADV",
            "Register state advisor",
            "Schedule review",
        ],
    }


def test_generator_normalises_backend_output() -> None:
    generator = LocalGenerator("phi-mini", _dummy_backend, default_prompt_builder)
    payload = ProposeInput(goal="Summarize", context={"memory": "ops/NGINX-ok:2025-08-22"})
    proposal = generator.propose(payload)

    assert proposal.summary.startswith("Plan covers")
    assert len(proposal.rationale) == 2
    assert proposal.plan[-1] == "Schedule review"


def test_validator_detects_missing_premises() -> None:
    proposal = Proposal(
        summary="RIA setup overview",
        rationale=["Mentioned Form ADV"],
        plan=["Draft policy"],
    )
    rules = RuleSet(required_premises=["state filing timeline"], compliance_steps=["Form ADV"])
    memory = MemoryStore(facts={"ops/NGINX-ok:2025-08-22": "NGINX healthy"})

    result = validate(proposal, rules, memory)

    assert not result.logic_chain_valid or result.missing_premises
    assert "Compliance template requirements not satisfied." in result.notes


def test_arbiter_rejects_on_banned_language() -> None:
    proposal = Proposal(
        summary="As an AI I cannot access",  # contains banned fallback phrase
        rationale=["Investigate manual records"],
        plan=["Escalate"]
    )
    rules = RuleSet()
    memory = MemoryStore(facts={})

    validation = validate(proposal, rules, memory)
    decision = decide(validation)

    assert decision.decision == "reject"
    assert "banned_fallbacks" in decision.reasons


def test_logger_appends_round(tmp_path: Path) -> None:
    logger = DuetLogger(tmp_path)
    task = TaskDescriptor(id="t-1", goal="demo", constraints=["no filler"])
    proposal = Proposal(summary="OK", rationale=["Item"], plan=["Action"])
    validation = ValidationResult(
        logic_chain_valid=True,
        contradictions=[],
        missing_premises=[],
        missing_compliance_steps=[],
        banned_fallbacks_detected=[],
        memory_refs=["ops/NGINX-ok:2025-08-22"],
    )
    validation.score.truth = 0.9
    validation.score.completeness = 0.8
    validation.score.style_fit = 1.0
    decision = ArbiterDecision(decision="accept", winner="LLM", reasons=["passes_all_checks"])

    logger.append_round(
        session_id="lucidia-2025-10-15-001",
        task=task,
        round_index=1,
        generator_model="phi-mini",
        proposal=proposal,
        validation=validation,
        arbiter=decision,
        final_status="pending-revision",
        next_actions=["add state filing timeline"],
    )

    log_file = next(tmp_path.iterdir())
    content = log_file.read_text(encoding="utf-8").strip().splitlines()
    record = json.loads(content[0])

    assert record["session_id"] == "lucidia-2025-10-15-001"
    assert record["arbiter"]["decision"] == "accept"
    assert record["final"]["next_actions"] == ["add state filing timeline"]
