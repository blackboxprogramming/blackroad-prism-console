from datetime import datetime
from pathlib import Path
import json
from typing import List, Dict

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "sales" / "deals"
OUT = ROOT / "artifacts" / "sales"


def _parse_date(s: str) -> datetime:
    return datetime.fromisoformat(s)


def build_report(start: datetime, end: datetime) -> Path:
    wins = losses = 0
    discounts: List[float] = []
    for f in ART.glob("*.json"):
        data = json.loads(f.read_text())
        created = _parse_date(data.get("created_at"))
        if not (start <= created <= end):
            continue
        discounts.append(data.get("requested_discount", 0))
        if data.get("status") == "won":
            wins += 1
        elif data.get("status") == "lost":
            losses += 1
    avg_disc = sum(discounts) / len(discounts) if discounts else 0
    month = start.strftime("%Y%m")
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"winloss_{month}.md"
    path.write_text(
        f"Wins: {wins}\nLosses: {losses}\nAvg discount: {avg_disc:.2f}\n"
    )
    return path
