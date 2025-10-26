"""Turn Guardian contradictions into teaching cards."""

from __future__ import annotations

from typing import Any, Dict


def contradiction_to_card(contradiction: Dict[str, Any]) -> Dict[str, Any]:
    """Create a teaching card from a Guardian contradiction."""

    identifier = contradiction.get("id", "contradiction")
    incident = contradiction.get("incident", "unknown")
    lesson_id = f"L-GUARD-{identifier}"
    narrative = contradiction.get("summary", "Guardian flagged a mismatch.")

    return {
        "id": lesson_id,
        "title": contradiction.get("title", f"Repair {incident}"),
        "audience": contradiction.get("audience", "engineers"),
        "level": "clinic",
        "context_links": contradiction.get("context_links", [contradiction.get("url", "./")]),
        "goals": [
            "Describe the contradiction and impacted guardrail.",
            "Propose a repair experiment with energy budget.",
            "Update the relevant practice track.",
        ],
        "energy_hint": contradiction.get("energy_hint", "Keep repair loop under 1J per attempt."),
        "steps": [
            {"type": "read", "content": narrative},
            {
                "type": "discuss",
                "content": contradiction.get("question", "Why did the guard disagree with the output?"),
            },
            {
                "type": "code",
                "content": contradiction.get("action", "Draft a repair test that would catch this earlier."),
            },
        ],
        "hints": contradiction.get(
            "hints",
            [
                "List all safety gates touched by the incident.",
                "Pair each gate with the mastery metric it protects.",
            ],
        ),
        "exit_ticket": contradiction.get(
            "exit_ticket",
            "Explain how the repair becomes part of the retrieval practice loop.",
        ),
    }


__all__ = ["contradiction_to_card"]
