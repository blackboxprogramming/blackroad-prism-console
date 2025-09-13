from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from typing import Dict, List

from tools import artifacts, storage

from .utils import ART, ROOT, lake_write, record


@dataclass
class PathDef:
    id: str
    name: str
    role_track: str
    courses: List[str]
    required_percent: int


@dataclass
class Assignment:
    user_id: str
    path_id: str
    due_date: str
    progress: Dict[str, bool]


def _generate_path_id(name: str, role_track: str) -> str:
    track = "".join(w[0].upper() for w in role_track.split())
    words = name.split()
    tail = words[1][:3].upper() if len(words) > 1 else words[0][:3].upper()
    return f"{track}_{tail}"


def new_path(name: str, role_track: str, courses: List[str], required_percent: int) -> PathDef:
    pid = _generate_path_id(name, role_track)
    path_def = PathDef(pid, name, role_track, courses, required_percent)
    raw = storage.read(str(ART / "paths.json"))
    data = json.loads(raw) if raw else []
    data.append(asdict(path_def))
    artifacts.validate_and_write(
        str(ART / "paths.json"), data, str(ROOT / "contracts" / "schemas" / "paths.json")
    )
    lake_write("paths", asdict(path_def))
    record("paths_loaded", 1)
    return path_def


def assign(user_id: str, path_id: str, due_date: str) -> Assignment:
    assignment = Assignment(user_id, path_id, due_date, {})
    raw = storage.read(str(ART / "assignments.json"))
    data = json.loads(raw) if raw else []
    data.append(asdict(assignment))
    artifacts.validate_and_write(
        str(ART / "assignments.json"),
        data,
        str(ROOT / "contracts" / "schemas" / "assignments.json"),
    )
    lake_write("assignments", asdict(assignment))
    record("paths_assigned", 1)
    return assignment
