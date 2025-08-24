"""Basic logic utilities for Infinity Math."""
from pathlib import Path
import json

OUTPUT_DIR = Path(__file__).resolve().parent / "output" / "logic"


def truth_table(a: bool, b: bool) -> dict:
    """Return a simple truth table row for AND/OR."""
    return {"a": a, "b": b, "and": a and b, "or": a or b}


def save_example() -> Path:
    """Generate a tiny truth table and save it as JSON."""
    rows = [truth_table(a, b) for a in (False, True) for b in (False, True)]
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_DIR / "truth_table.json"
    out_file.write_text(json.dumps(rows, indent=2))
    return out_file
