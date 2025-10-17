from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from typing import List, Dict

import yaml
from tools import storage

ROOT = Path(__file__).resolve().parents[1]
CAL_DIR = ROOT / "configs" / "legal" / "calendar"
ART_DIR = ROOT / "artifacts" / "legal"
CAL_PATH = ART_DIR / "calendar.jsonl"


def build() -> List[Dict]:
    items: List[Dict] = []
    for path in CAL_DIR.glob("*.yaml"):
        data = yaml.safe_load(path.read_text()) or []
        for item in data:
            if isinstance(item.get("due_date"), date):
                item["due_date"] = item["due_date"].isoformat()
            items.append(item)
            storage.write(str(CAL_PATH), json.dumps(item))
    return items


def list_items(from_date: str, to_date: str) -> List[Dict]:
    start = date.fromisoformat(from_date)
    end = date.fromisoformat(to_date)
    items: List[Dict] = []
    text = storage.read(str(CAL_PATH))
    for line in text.splitlines():
        item = json.loads(line)
        due = date.fromisoformat(item["due_date"])
        if start <= due <= end:
            items.append(item)
    return items
