from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, List


def load_gl(fixtures_path: str) -> List[Dict]:
    path = Path(fixtures_path)
    records: List[Dict] = []
    for file in path.glob("*"):
        if file.suffix.lower() == ".json":
            data = json.loads(file.read_text())
            if isinstance(data, list):
                records.extend(data)
        elif file.suffix.lower() == ".csv":
            with file.open(newline="", encoding="utf-8") as fh:
                reader = csv.DictReader(fh)
                records.extend(list(reader))
    mapped: List[Dict] = []
    for r in records:
        mapped.append(
            {
                "account": r.get("account") or r.get("Account"),
                "period": r.get("period") or r.get("Period"),
                "debit": float(r.get("debit") or r.get("Debit") or 0),
                "credit": float(r.get("credit") or r.get("Credit") or 0),
                "entity": r.get("entity") or r.get("Entity"),
            }
        )
    return mapped
