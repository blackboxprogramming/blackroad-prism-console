from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from typing import List, Dict

from tools import storage
from .clm import load_contract

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "legal"
OBLIG_PATH = ART_DIR / "obligations.json"


def extract(id: str) -> List[Dict]:
    contract = load_contract(id)
    storage.write(str(OBLIG_PATH), json.dumps(contract.obligations))
    return contract.obligations


def list_obligations(due_within: int | None = None, today: date | None = None) -> List[Dict]:
    data = json.loads(storage.read(str(OBLIG_PATH)) or "[]")
    if due_within is None:
        return data
    today = today or datetime.utcnow().date()
    res = []
    for ob in data:
        due = date.fromisoformat(ob["due"])
        if 0 <= (due - today).days <= due_within:
            res.append(ob)
    return res
