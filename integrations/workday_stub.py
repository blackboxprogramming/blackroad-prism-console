from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, List


def load_headcount(fixtures_path: str) -> List[Dict]:
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
                "employee_id": r.get("employee_id") or r.get("EmployeeID") or r.get("employeeId"),
                "dept": r.get("dept") or r.get("Dept"),
                "role": r.get("role") or r.get("Role"),
                "grade": r.get("grade") or r.get("Grade"),
                "region": r.get("region") or r.get("Region"),
                "start_date": r.get("start_date") or r.get("StartDate"),
                "status": r.get("status") or r.get("Status"),
            }
        )
    return mapped
