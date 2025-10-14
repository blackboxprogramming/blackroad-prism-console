from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, List


def load_opportunities(fixtures_path: str) -> List[Dict]:
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
                "id": r.get("id") or r.get("Id"),
                "owner": r.get("owner") or r.get("Owner"),
                "stage": r.get("stage") or r.get("Stage"),
                "amount": float(r.get("amount") or r.get("Amount") or 0),
                "close_date": r.get("close_date") or r.get("CloseDate"),
                "age_days": int(r.get("age_days") or r.get("AgeDays") or 0),
            }
        )
    return mapped
