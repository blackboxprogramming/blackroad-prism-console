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
