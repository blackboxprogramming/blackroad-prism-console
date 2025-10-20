import json
from datetime import datetime
from pathlib import Path
from typing import List

from tools import artifacts, metrics, storage

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = ROOT / "artifacts/marketing"
LAKE = ROOT / "artifacts/lake"
CONTRACTS = ROOT / "contracts/schemas"


def _load_calendar() -> List[dict]:
    data = storage.read(str(ARTIFACTS_DIR / "calendar.json"))
    return json.loads(data) if data else []


def add_item(title: str, type_: str, due: str, owner: str) -> dict:
    cal = _load_calendar()
    iid = f"CAL{len(cal)+1:04d}"
    item = {"id": iid, "title": title, "type": type_, "due": due, "owner": owner, "status": "planned"}
    cal.append(item)
    artifacts.validate_and_write(str(ARTIFACTS_DIR / "calendar.json"), cal)
    artifacts.validate_and_write(
        str(LAKE / "content_calendar.jsonl"),
        item,
        schema_path=str(CONTRACTS / "content_calendar.schema.json"),
    )
    metrics.emit("content_calendar_updated")
    return item


def view_month(month: str) -> str:
    cal = _load_calendar()
    dt = datetime.strptime(month, "%Y-%m")
    lines = [f"# {dt.strftime('%B %Y')}"]
    for item in cal:
        if item["due"].startswith(month):
            day = int(item["due"].split("-")[2])
            lines.append(f"{day:02d}: {item['title']}")
    out = "\n".join(lines)
    storage.write(str(ARTIFACTS_DIR / "calendar.md"), out)
    return out
