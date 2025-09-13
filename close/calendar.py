from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import date, datetime
from pathlib import Path
from typing import List
import json
import yaml
from tools import storage, artifacts, metrics


ARTIFACTS_ROOT = Path("artifacts/close")
SCHEMA = "contracts/schemas/close_calendar.json"


@dataclass
class CloseTask:
    id: str
    name: str
    owner_role: str
    due: str
    deps: List[str] = field(default_factory=list)
    status: str = "pending"
    evidence_paths: List[str] = field(default_factory=list)


@dataclass
class CloseCalendar:
    period: str
    tasks: List[CloseTask] = field(default_factory=list)

    @classmethod
    def from_template(cls, period: str, template_path: str) -> "CloseCalendar":
        data = yaml.safe_load(storage.read(template_path)) or {}
        tasks = []
        for t in data.get("tasks", []):
            due = t.get("due")
            if isinstance(due, (date, datetime)):
                t["due"] = due.isoformat()
            tasks.append(CloseTask(**t))
        return cls(period=period, tasks=tasks)

    def _dir(self) -> Path:
        return ARTIFACTS_ROOT / self.period

    def save(self) -> None:
        path = self._dir()
        data = [asdict(t) for t in self.tasks]
        artifacts.validate_and_write(str(path / "calendar.json"), data, SCHEMA)
        status_lines = "\n".join(f"{t.id}\t{t.status}" for t in self.tasks)
        artifacts.validate_and_write(str(path / "status.md"), status_lines)
        metrics.emit("close_calendar_saved")

    def update(self, task_id: str, status: str | None = None, evidence: str | None = None) -> None:
        task = next(t for t in self.tasks if t.id == task_id)
        if status:
            if status == "done" and not (evidence or task.evidence_paths):
                raise ValueError("SOX_EVIDENCE_MISSING")
            task.status = status
        if evidence:
            task.evidence_paths.append(evidence)
        self.save()

    def topo_order(self) -> List[str]:
        deps = {t.id: list(t.deps) for t in self.tasks}
        ordered: List[str] = []
        while deps:
            ready = [tid for tid, d in deps.items() if not d]
            if not ready:
                raise ValueError("cyclic")
            ordered.extend(sorted(ready))
            for r in ready:
                deps.pop(r)
            for d in deps.values():
                for r in ready:
                    if r in d:
                        d.remove(r)
        return ordered

    def sla_flags(self, today: str) -> List[str]:
        return [t.id for t in self.tasks if t.due < today and t.status != "done"]


def load_calendar(period: str) -> CloseCalendar:
    path = ARTIFACTS_ROOT / period / "calendar.json"
    tasks_data = json.loads(storage.read(str(path))) if path.exists() else []
    tasks = [CloseTask(**t) for t in tasks_data]
    return CloseCalendar(period, tasks)
