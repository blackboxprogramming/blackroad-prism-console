#!/usr/bin/env python3
"""Utility helpers for running the BlackRoad resume claim verifier."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence

DEFAULT_CLAIMS_PATH = Path("docs/verification/blackroad_resume_claims.json")

PROMPT_TEMPLATE = """Ψ′-pre (scope):
You are the Truth Agent. Verify each resume bullet in the JSON against repo artifacts and logs. 
Return a trinary verdict per bullet: TRUE, FALSE, or NEEDS-EVIDENCE. 
Treat quantitative metrics (%, latency, grades) as NEEDS-EVIDENCE unless supported by logs/benchmarks.

Method:
1) For each bullet:
   a) Open listed files; search for named classes/functions/routes and behaviors (e.g., DistributedMemoryPalace, /chat SSE, EstimatorQNN).
   b) Cross-check with Evidence Map IDs to ensure the code paths exist and perform the claimed role.
   c) If a metric is claimed, look for benchmark/ops logs (e.g., events.log, perf/*.json, CI artifacts). 
      If none found, mark NEEDS-EVIDENCE and emit a contradiction record with 'metric_missing'.
2) Emit a table:
   - bullet_text
   - verdict (TRUE|FALSE|NEEDS-EVIDENCE)
   - supporting_snippets (file:path:line ranges)
   - contradictions[] (if any)
   - remediation (what log/benchmark to add)

Success criteria:
- No hallucinated files.
- Deterministic, reproducible outputs given the same repo state.
- All metric claims either grounded by logs or downgraded to NEEDS-EVIDENCE with a remediation step.

Ψ′-post (write):
If any verdict is FALSE, generate a minimal PR plan (file, snippet to add, test) to make it TRUE."""


def load_claims(path: Path) -> Dict[str, Any]:
    """Load the verification claims JSON file."""
    content = path.read_text(encoding="utf-8")
    return json.loads(content)


def build_payload(claims: Dict[str, Any]) -> Dict[str, Any]:
    """Build the combined payload for the contradiction verifier."""
    return {
        "claims": claims,
        "prompt": PROMPT_TEMPLATE.strip(),
    }


def resolve_top_resume_bullets(claims: Dict[str, Any]) -> List[str]:
    """Return the curated top resume bullet texts."""

    if "top_resume_bullets" in claims:
        bullets = claims["top_resume_bullets"]
        if not isinstance(bullets, list) or not all(isinstance(item, str) for item in bullets):
            raise SystemExit("top_resume_bullets must be a list of strings.")
        return bullets

    bullet_ids = claims.get("top_resume_bullet_ids")
    if bullet_ids is None:
        raise SystemExit("No top resume bullet configuration found in claims JSON.")
    if not isinstance(bullet_ids, list) or not all(isinstance(item, int) for item in bullet_ids):
        raise SystemExit("top_resume_bullet_ids must be a list of integers.")

    bullets = claims.get("bullets")
    if not isinstance(bullets, list):
        raise SystemExit("bullets section missing or invalid in claims JSON.")

    resolved: List[str] = []
    for index in bullet_ids:
        try:
            bullet = bullets[index]
        except (IndexError, TypeError):
            raise SystemExit(f"top_resume_bullet_ids entry {index} is out of range.") from None
        if not isinstance(bullet, dict) or "text" not in bullet or not isinstance(bullet["text"], str):
            raise SystemExit(f"Bullet at index {index} is malformed; expected an object with a text field.")
        resolved.append(bullet["text"])

    return resolved


def validate_claims(claims: Dict[str, Any]) -> None:
    """Validate the structure of the claims payload."""

    entity = claims.get("entity")
    if not isinstance(entity, str) or not entity.strip():
        raise SystemExit("claims JSON must include a non-empty 'entity' string.")

    bullets = claims.get("bullets")
    if not isinstance(bullets, list) or not bullets:
        raise SystemExit("claims JSON must include a non-empty 'bullets' list.")

    for index, bullet in enumerate(bullets):
        if not isinstance(bullet, dict):
            raise SystemExit(f"Bullet at index {index} must be an object.")

        text = bullet.get("text")
        if not isinstance(text, str) or not text.strip():
            raise SystemExit(f"Bullet at index {index} must include non-empty text.")

        evidence_ids = bullet.get("evidence_ids")
        if evidence_ids is not None and (
            not isinstance(evidence_ids, list)
            or not all(isinstance(item, int) for item in evidence_ids)
        ):
            raise SystemExit(
                f"Bullet at index {index} has invalid evidence_ids; expected a list of integers."
            )

        files = bullet.get("files")
        if files is not None and (
            not isinstance(files, list) or not all(isinstance(item, str) for item in files)
        ):
            raise SystemExit(
                f"Bullet at index {index} has invalid files; expected a list of strings."
            )

        checks = bullet.get("checks")
        if checks is not None and (
            not isinstance(checks, list) or not all(isinstance(item, str) for item in checks)
        ):
            raise SystemExit(
                f"Bullet at index {index} has invalid checks; expected a list of strings."
            )

        status = bullet.get("status")
        if status is not None and not isinstance(status, str):
            raise SystemExit(f"Bullet at index {index} has invalid status; expected a string.")

    resolve_top_resume_bullets(claims)
    resolve_interview_validation(claims)


def format_resume_bullets(bullets: Iterable[str]) -> str:
    """Format the resume bullets as a Markdown list."""
    lines = [f"- {bullet}" for bullet in bullets]
    return "\n".join(lines)


def resolve_interview_validation(claims: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Return interview validation guidance entries."""

    entries = claims.get("interview_validation")
    if entries is None:
        return []
    if not isinstance(entries, list):
        raise SystemExit("interview_validation must be a list when present.")

    bullets = claims.get("bullets")
    if not isinstance(bullets, list):
        raise SystemExit("bullets section missing or invalid in claims JSON.")

    resolved: List[Dict[str, Any]] = []
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            raise SystemExit(f"interview_validation entry {index} must be an object.")

        question = entry.get("question")
        if not isinstance(question, str) or not question.strip():
            raise SystemExit(
                f"interview_validation entry {index} must include a non-empty question string."
            )

        related_id = entry.get("related_bullet_id")
        if not isinstance(related_id, int):
            raise SystemExit(
                f"interview_validation entry {index} must include an integer related_bullet_id."
            )
        try:
            related_bullet = bullets[related_id]
        except (IndexError, TypeError):
            raise SystemExit(
                f"interview_validation entry {index} references bullet {related_id}, which is out of range."
            ) from None
        if not isinstance(related_bullet, dict) or "text" not in related_bullet:
            raise SystemExit(
                f"Bullet at index {related_id} is malformed; cannot resolve interview validation mapping."
            )

        validation = entry.get("validation")
        if not isinstance(validation, list) or not all(
            isinstance(item, str) and item.strip() for item in validation
        ):
            raise SystemExit(
                f"interview_validation entry {index} must include a non-empty list of validation steps."
            )

        evidence_focus = entry.get("evidence_focus")
        if evidence_focus is not None and (
            not isinstance(evidence_focus, list)
            or not all(isinstance(item, str) and item.strip() for item in evidence_focus)
        ):
            raise SystemExit(
                f"interview_validation entry {index} has invalid evidence_focus; expected a list of non-empty strings."
            )

        resolved.append(
            {
                "question": question,
                "related_bullet_text": related_bullet["text"],
                "validation": validation,
                "evidence_focus": evidence_focus or [],
            }
        )

    return resolved


def format_interview_validation(entries: Sequence[Dict[str, Any]]) -> str:
    """Render interview validation guidance as Markdown."""

    if not entries:
        return ""

    lines = ["Validation Backing for Interview Probes:"]
    for index, entry in enumerate(entries, start=1):
        lines.append(f"{index}. {entry['question']}")
        lines.append(f"   Related bullet: {entry['related_bullet_text']}")
        for step in entry["validation"]:
            lines.append(f"   - {step}")
        if entry["evidence_focus"]:
            focus = ", ".join(entry["evidence_focus"])
            lines.append(f"   Evidence focus: {focus}")

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Emit the Ψ′ verification payload for resume claims.")
    parser.add_argument(
        "--claims",
        type=Path,
        default=DEFAULT_CLAIMS_PATH,
        help="Path to the resume claims JSON file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional path to write the payload JSON. Prints to stdout when omitted.",
    )
    action_group = parser.add_mutually_exclusive_group()
    action_group.add_argument(
        "--resume-bullets",
        action="store_true",
        help="When set, print the top resume bullets instead of the verification payload.",
    )
    action_group.add_argument(
        "--validate",
        action="store_true",
        help="Validate the claims file structure and exit without emitting the payload.",
    )

    args = parser.parse_args()
    claims = load_claims(args.claims)
    if args.validate:
        validate_claims(claims)
        print("Claims file structure verified.")
        return

    if args.resume_bullets:
        bullets = resolve_top_resume_bullets(claims)
        rendered = format_resume_bullets(bullets)
        validation_entries = resolve_interview_validation(claims)
        validation_section = format_interview_validation(validation_entries)
        if validation_section:
            rendered = f"{rendered}\n\n{validation_section}"
        if args.output is None:
            print(rendered)
        else:
            args.output.write_text(f"{rendered}\n", encoding="utf-8")
        return

    payload = build_payload(claims)

    if args.output is None:
        print(json.dumps(payload, indent=2))
    else:
        args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
