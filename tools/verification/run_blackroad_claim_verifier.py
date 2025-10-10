#!/usr/bin/env python3
"""Utility helpers for running the BlackRoad resume claim verifier."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

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

    args = parser.parse_args()
    claims = load_claims(args.claims)
    payload = build_payload(claims)

    if args.output is None:
        print(json.dumps(payload, indent=2))
    else:
        args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
