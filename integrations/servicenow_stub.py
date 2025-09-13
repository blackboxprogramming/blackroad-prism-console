from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, List


def load_incidents(fixtures_path: str) -> List[Dict]:
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
                "sev": r.get("sev") or r.get("Sev"),
                "opened_at": r.get("opened_at") or r.get("OpenedAt"),
                "closed_at": r.get("closed_at") or r.get("ClosedAt"),
                "service": r.get("service") or r.get("Service"),
            }
        )
    return mapped
