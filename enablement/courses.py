from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List

import yaml

from tools import artifacts, storage

from .utils import ART, ROOT, lake_write, record


@dataclass
class Module:
    id: str
    type: str
    title: str
    est_min: int
    resources: List[str]


@dataclass
class Course:
    id: str
    title: str
    role_track: str
    duration_min: int
    prereqs: List[str]
    modules: List[Module]
    version: str


def _detect_cycles(graph: dict[str, List[str]]) -> None:
    visited: set[str] = set()
    stack: set[str] = set()

    def visit(node: str) -> None:
        if node in stack:
            raise ValueError("cycle detected")
        if node not in visited:
            stack.add(node)
            for nbr in graph.get(node, []):
                visit(nbr)
            stack.remove(node)
            visited.add(node)

    for n in graph:
        visit(n)


def load_courses(dir_path: str) -> List[Course]:
    courses: List[Course] = []
    for path in Path(dir_path).glob("*.yaml"):
        data = yaml.safe_load(Path(path).read_text())
        modules = [Module(**m) for m in data.get("modules", [])]
        course = Course(
            id=data["id"],
            title=data["title"],
            role_track=data["role_track"],
            duration_min=data.get("duration_min", 0),
            prereqs=data.get("prereqs", []),
            modules=modules,
            version=data.get("version", "1"),
        )
        courses.append(course)
    graph = {c.id: c.prereqs for c in courses}
    _detect_cycles(graph)
    payload = [asdict(c) for c in courses]
    artifacts.validate_and_write(
        str(ART / "courses.json"), payload, str(ROOT / "contracts" / "schemas" / "courses.json")
    )
    catalog_md = "\n".join(f"- {c.id}: {c.title}" for c in courses)
    artifacts.validate_and_write(str(ART / "catalog.md"), catalog_md)
    for c in payload:
        lake_write("courses", c)
    record("courses_loaded", len(courses))
    return courses


def list_courses(role_track: str) -> List[dict]:
    raw = storage.read(str(ART / "courses.json"))
    if not raw:
        return []
    data = json.loads(raw)
    return [c for c in data if c["role_track"] == role_track]
