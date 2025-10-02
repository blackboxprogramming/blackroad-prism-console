"""CSV import/export helpers for tasks."""

from __future__ import annotations

import csv
import json
import re
from datetime import datetime
from pathlib import Path
from typing import List

from orchestrator.protocols import Task


def import_tasks(csv_path: str | Path) -> List[Task]:
    tasks: List[Task] = []
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            context = json.loads(row.get("context_json") or "{}")
            depends_raw = row.get("depends_on_csv") or ""
            depends_on = [d.strip() for d in re.split(r"[;,]", depends_raw) if d.strip()]
            sched = row.get("scheduled_for_iso")
            scheduled = datetime.fromisoformat(sched) if sched else None
            tasks.append(
                Task(
                    id=row["id"],
                    goal=row["goal"],
                    context=context,
                    depends_on=depends_on,
                    scheduled_for=scheduled,
                    bot=row.get("bot", ""),
                )
            )
    return tasks


def export_tasks(csv_path: str | Path, tasks: List[Task]) -> None:
    fieldnames = [
        "id",
        "goal",
        "context_json",
        "depends_on_csv",
        "scheduled_for_iso",
        "bot",
        "status",
    ]
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for t in tasks:
            writer.writerow(
                {
                    "id": t.id,
                    "goal": t.goal,
                    "context_json": json.dumps(t.context),
                    "depends_on_csv": ",".join(t.depends_on),
                    "scheduled_for_iso": t.scheduled_for.isoformat() if t.scheduled_for else "",
                    "bot": t.bot,
                    "status": t.status,
                }
            )

