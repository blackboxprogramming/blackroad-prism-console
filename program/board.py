"""In-memory program board with simple JSON persistence."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date
from pathlib import Path
from typing import Dict, List, Literal, Optional

from orchestrator.protocols import BotExecutionError
from tools.storage import load_json, save_json

BOARD_PATH = Path("program/board.json")


@dataclass
class ProgramItem:
    id: str
    title: str
    owner: str
    bot: str
    status: Literal["planned", "in_progress", "blocked", "done"] = "planned"
    start: Optional[date] = None
    due: Optional[date] = None
    depends_on: List[str] = field(default_factory=list)


class ProgramBoard:
    """Collection of :class:`ProgramItem` instances with persistence helpers."""

    def __init__(self) -> None:
        self.items: Dict[str, ProgramItem] = {}
        for raw in load_json(BOARD_PATH, []):
            if raw.get("start"):
                raw["start"] = date.fromisoformat(raw["start"])
            if raw.get("due"):
                raw["due"] = date.fromisoformat(raw["due"])
            item = ProgramItem(**raw)
            self.items[item.id] = item

    # ------------------------------------------------------------------
    # Persistence helpers
    def _save(self) -> None:
        data = []
        for item in self.items.values():
            row = asdict(item)
            if row["start"]:
                row["start"] = row["start"].isoformat()
            if row["due"]:
                row["due"] = row["due"].isoformat()
            data.append(row)
        save_json(BOARD_PATH, data)

    # ------------------------------------------------------------------
    # CRUD operations
    def add(self, item: ProgramItem) -> None:
        self.items[item.id] = item
        self._save()

    def update(self, id: str, **fields) -> None:
        item = self.items[id]
        for key, value in fields.items():
            if key in {"start", "due"} and isinstance(value, str):
                value = date.fromisoformat(value)
            setattr(item, key, value)
        self._save()

    def get(self, id: str) -> Optional[ProgramItem]:
        return self.items.get(id)

    def list(self, filter_by_status: Optional[str] = None) -> List[ProgramItem]:
        items = list(self.items.values())
        if filter_by_status:
            items = [i for i in items if i.status == filter_by_status]
        return items

    # ------------------------------------------------------------------
    def critical_path(self) -> List[str]:
        """Return task IDs in dependency order using a topological sort.

        Raises
        ------
        BotExecutionError
            If a dependency cycle is detected.
        """

        # Kahn's algorithm
        deps = {item.id: set(item.depends_on) for item in self.items.values()}
        ready = [i for i, d in deps.items() if not d]
        order: List[str] = []

        while ready:
            node = ready.pop(0)
            order.append(node)
            for other, d in deps.items():
                if node in d:
                    d.remove(node)
                    if not d:
                        ready.append(other)
            deps.pop(node, None)

        if deps:  # remaining nodes => cycle
            raise BotExecutionError("dependency_cycle", details=list(deps.keys()))
        return order

    # ------------------------------------------------------------------
    def as_markdown_roadmap(self) -> str:
        """Render the board as a Markdown table with a tiny ASCII Gantt chart."""

        items = self.list()
        if not items:
            return "(empty board)"

        # Establish 13 week window
        starts = [i.start for i in items if i.start]
        board_start = min(starts) if starts else date.today()

        lines = ["|ID|Title|Status|Gantt|", "|---|---|---|---|"]
        header_weeks = " ".join(f"Wk{w:02d}" for w in range(1, 14))
        lines.append(f"| | | |{header_weeks}|")

        for item in items:
            s = item.start or board_start
            e = item.due or s
            start_idx = max(0, min(12, (s - board_start).days // 7))
            end_idx = max(0, min(12, (e - board_start).days // 7))
            bar = "".join("#" if start_idx <= i <= end_idx else "." for i in range(13))
            lines.append(f"|{item.id}|{item.title}|{item.status}|{bar}|")

        return "\n".join(lines)

