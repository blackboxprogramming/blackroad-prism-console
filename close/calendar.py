from __future__ import annotations

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
