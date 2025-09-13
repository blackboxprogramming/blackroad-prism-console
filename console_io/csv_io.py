"""CSV helpers for tasks."""
from __future__ import annotations

import csv
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List


@dataclass
class Task:
    id: str
    title: str
    owner: str


def export_tasks_csv(path: str | Path, tasks: List[Task]) -> None:
    path = Path(path)
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=["id", "title", "owner"])
        writer.writeheader()
        for t in tasks:
            writer.writerow(asdict(t))


def import_tasks_csv(path: str | Path) -> List[Task]:
    path = Path(path)
    with path.open("r", newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        return [Task(**row) for row in reader]
