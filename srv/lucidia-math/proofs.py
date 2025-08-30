"""Recursive proof and contradiction engine.

This module only sketches the idea of a system that can detect
self-referential definitions.  It accepts simple recursive definitions
expressed as strings and heuristically flags ones that contain direct
self-reference, logging them to ``contradiction_log.json``.
"""

from __future__ import annotations

import json
from pathlib import Path

LOG_FILE = Path("contradiction_log.json")


def is_contradictory(expr: str) -> bool:
    """Return ``True`` if ``expr`` appears self-referential.

    The heuristic simply checks for nested occurrences of ``f(f(`` which is
    characteristic of some Gödel-like undecidable constructions.
    """

    needle = "f(f("
    return needle in expr.replace(" ", "")


def log_contradiction(expr: str) -> None:
    """Append ``expr`` to :data:`LOG_FILE`."""

    data = []
    if LOG_FILE.exists():
        data = json.loads(LOG_FILE.read_text())
    data.append(expr)
    LOG_FILE.write_text(json.dumps(data, indent=2))


def demo() -> bool:
    """Demonstrate contradiction detection with a toy example."""

    example = "f(x) = f(f(x-1)) + 1"
    flag = is_contradictory(example)
    if flag:
        log_contradiction(example)
    return flag
"""Proof utilities for simple contradiction examples."""
from pathlib import Path
import json

OUTPUT_DIR = Path(__file__).resolve().parent / "output" / "contradictions"


def save_contradiction() -> Path:
    """Record a tiny proof by contradiction and save to JSON."""
    proof = {
        "statement": "Assume there exists an integer between 2 and 3.",
        "contradiction": "No integer exists between 2 and 3.",
        "result": "Therefore, assumption is false."
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_DIR / "contradiction_log.json"
    out_file.write_text(json.dumps(proof, indent=2))
    return out_file
