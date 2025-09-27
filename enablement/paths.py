from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import date
from typing import Dict, List, Optional

from tools import artifacts, storage

from .bias import generate_assignment_bias_report
from .utils import (
    ART,
    ROOT,
    lake_write,
    log_action,
    read_previous_state,
    record,
    store_previous_state,
    utc_now,
)

DEFAULT_MODEL_TYPE = "deterministic-rules"
DEFAULT_TRAINING_SCOPE = "Enablement heuristics + manual reviews"


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
    rationale: str
    model_version: str
    assigned_by: str
    created_at: str


def _assignments_path() -> str:
    return str(ART / "assignments.json")


def _load_assignments() -> list[dict]:
    raw = storage.read(_assignments_path())
    return json.loads(raw) if raw else []


def _write_assignments(data: list[dict]) -> None:
    artifacts.validate_and_write(
        _assignments_path(),
        data,
        str(ROOT / "contracts" / "schemas" / "assignments.json"),
    )


def _publish_model_manifest(
    model_version: str,
    model_type: str,
    training_scope: str,
    updated_at: str,
) -> None:
    manifest_path = ART / "model_manifest.json"
    raw = storage.read(str(manifest_path))
    manifest = json.loads(raw) if raw else {}
    manifest[model_version] = {
        "model_type": model_type,
        "training_scope": training_scope,
        "updated_at": updated_at,
    }
    storage.write(str(manifest_path), json.dumps(manifest, indent=2, sort_keys=True))


def _normalise(value: str, name: str) -> str:
    text = value.strip()
    if not text:
        raise ValueError(f"{name} must be non-empty")
    return text


def _resolve_model_metadata(
    model_type: Optional[str],
    training_scope: Optional[str],
    model_updated_at: Optional[str],
) -> tuple[str, str, str]:
    resolved_type = (model_type or DEFAULT_MODEL_TYPE).strip() or DEFAULT_MODEL_TYPE
    resolved_scope = (training_scope or DEFAULT_TRAINING_SCOPE).strip() or DEFAULT_TRAINING_SCOPE
    resolved_updated = (
        model_updated_at.strip() if model_updated_at else date.today().isoformat()
    )
    return resolved_type, resolved_scope, resolved_updated


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


def assign(
    user_id: str,
    path_id: str,
    due_date: str,
    rationale: str,
    model_version: str,
    *,
    actor: str = "lucidia",
    model_type: Optional[str] = None,
    training_scope: Optional[str] = None,
    model_updated_at: Optional[str] = None,
) -> Assignment:
    clean_rationale = _normalise(rationale, "rationale")
    clean_version = _normalise(model_version, "model_version")

    existing = _load_assignments()
    store_previous_state("assignments", existing)

    assignment = Assignment(
        user_id=user_id,
        path_id=path_id,
        due_date=due_date,
        progress={},
        rationale=clean_rationale,
        model_version=clean_version,
        assigned_by=actor,
        created_at=utc_now(),
    )

    updated = existing + [asdict(assignment)]
    _write_assignments(updated)
    lake_write("assignments", asdict(assignment))
    record("paths_assigned", 1)

    log_action(
        "assignments.create",
        actor,
        clean_rationale,
        clean_version,
        {
            "user_id": user_id,
            "path_id": path_id,
            "due_date": due_date,
        },
    )

    resolved_type, resolved_scope, resolved_updated = _resolve_model_metadata(
        model_type, training_scope, model_updated_at
    )
    _publish_model_manifest(clean_version, resolved_type, resolved_scope, resolved_updated)
    generate_assignment_bias_report(updated)
    return assignment


def undo_last_assignment(actor: str, rationale: str, model_version: str) -> list[dict]:
    clean_rationale = _normalise(rationale, "rationale")
    clean_version = _normalise(model_version, "model_version")
    previous = read_previous_state("assignments")
    if not previous:
        return []
    current = _load_assignments()
    _write_assignments(previous)
    removed_count = max(len(current) - len(previous), 0)
    log_action(
        "assignments.undo",
        actor,
        clean_rationale,
        clean_version,
        {
            "restored_count": len(previous),
            "removed_count": removed_count,
        },
    )
    generate_assignment_bias_report(previous)
    return previous
