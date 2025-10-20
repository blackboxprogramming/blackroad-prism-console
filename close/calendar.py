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
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List
import yaml
from datetime import date

ARTIFACTS_ROOT = Path("artifacts/close")


@dataclass
class CloseTask:
    id: str
    name: str
    owner_role: str
    due: str
    deps: List[str] = field(default_factory=list)
    status: str = "pending"
    evidence_paths: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "owner_role": self.owner_role,
            "due": self.due,
            "deps": self.deps,
            "status": self.status,
            "evidence_paths": self.evidence_paths,
        }


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
    tasks: Dict[str, CloseTask]

    @classmethod
    def from_template(cls, period: str, template_path: str) -> "CloseCalendar":
        data = yaml.safe_load(Path(template_path).read_text())
        tasks = {}
        for t in data.get("tasks", []):
            task = CloseTask(
                id=t["id"],
                name=t["name"],
                owner_role=t.get("owner_role", "unknown"),
                due=str(t.get("due", period + "-28")),
                deps=t.get("deps", []),
            )
            tasks[task.id] = task
        return cls(period=period, tasks=tasks)

    @classmethod
    def load(cls, period: str) -> "CloseCalendar":
        base = ARTIFACTS_ROOT / period
        data = json.loads((base / "calendar.json").read_text())
        tasks = {t["id"]: CloseTask(**t) for t in data}
        return cls(period=period, tasks=tasks)

    def save(self) -> None:
        base = ARTIFACTS_ROOT / self.period
        base.mkdir(parents=True, exist_ok=True)
        data = [t.to_dict() for t in self.tasks.values()]
        (base / "calendar.json").write_text(json.dumps(data, indent=2))
        lines = [f"{t.id}\t{t.status}\t{t.due}" for t in self.topo_order()]
        (base / "status.md").write_text("\n".join(lines) + "\n")

    def update_task(self, task_id: str, status: str | None = None, evidence: str | None = None) -> None:
        task = self.tasks[task_id]
        if evidence:
            task.evidence_paths.append(evidence)
        if status:
            if status == "done" and not task.evidence_paths:
                raise ValueError("SOX_EVIDENCE_MISSING")
            task.status = status

    def topo_order(self) -> List[CloseTask]:
        """Return tasks in topological order."""
        deps = {tid: set(t.deps) for tid, t in self.tasks.items()}
        ready = [tid for tid, d in deps.items() if not d]
        order = []
        while ready:
            tid = ready.pop(0)
            order.append(self.tasks[tid])
            for other, d in deps.items():
                if tid in d:
                    d.remove(tid)
                    if not d:
                        ready.append(other)
        if len(order) != len(self.tasks):
            # cycle detected; fall back to id order
            return [self.tasks[tid] for tid in sorted(self.tasks)]
        return order

    def sla_flags(self) -> List[str]:
        today = date.today().isoformat()
        flags = []
        for t in self.tasks.values():
            if t.status != "done" and t.due < today:
                flags.append(t.id)
        return flags
