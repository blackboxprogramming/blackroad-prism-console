"""Simple finance helpers."""
from pathlib import Path
import json

OUTPUT_DIR = Path(__file__).resolve().parent / "output" / "finance"


def compound_interest(principal: float, rate: float, periods: int) -> float:
    """Compute compound interest."""
    return principal * (1 + rate) ** periods


def save_example() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    result = compound_interest(1000, 0.05, 10)
    out_file = OUTPUT_DIR / "compound.json"
    out_file.write_text(json.dumps({"future_value": result}, indent=2))
    return out_file
