from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import yaml

from tools import storage, metrics, artifacts
from . import ROOT, ARTIFACTS, LAKE, CONFIGS

IDEAS_QUEUE = ARTIFACTS / "ideas.jsonl"
BACKLOG = ARTIFACTS / "backlog.md"
COUNTER = ARTIFACTS / "last_idea_id.txt"
LAKE_TABLE = LAKE / "rnd_ideas.json"
SCHEMA = "contracts/schemas/rnd_ideas.json"


@dataclass
class Idea:
    id: str
    title: str
    problem: str
    solution: str
    owner: str
    tags: List[str]
    created_at: str
    status: str = "new"


def _next_id() -> str:
    last = int(storage.read(str(COUNTER)) or 0)
    new = last + 1
    storage.write(str(COUNTER), str(new))
    return f"I{new:03d}"


def _load_weights() -> dict:
    cfg_path = CONFIGS / "scoring.yaml"
    data = yaml.safe_load(storage.read(str(cfg_path))) or {}
    return data.get("weights", {})


def _feature_hash(seed: str) -> int:
    return int(hashlib.sha256(seed.encode("utf-8")).hexdigest(), 16) % 101


def score(idea: Idea) -> int:
    weights = _load_weights()
    total = 0.0
    weight_sum = 0.0
    for k, w in weights.items():
        val = _feature_hash(f"{idea.id}-{k}")
        total += val * w
        if w > 0:
            weight_sum += w
    if weight_sum == 0:
        return 0
    s = total / weight_sum
    return max(0, min(100, int(s)))


def _append_backlog(idea: Idea) -> None:
    header = "| id | title | owner | status |\n|---|---|---|---|\n"
    if not BACKLOG.exists():
        storage.write(str(BACKLOG), header)
    row = f"| {idea.id} | {idea.title} | {idea.owner} | {idea.status} |\n"
    with open(BACKLOG, "a", encoding="utf-8") as fh:
        fh.write(row)


def _write_lake(record: dict) -> None:
    existing = json.loads(storage.read(str(LAKE_TABLE)) or "[]")
    existing.append(record)
    artifacts.validate_and_write(str(LAKE_TABLE), existing, SCHEMA)


def new(
    title: str,
    problem: str,
    solution: str,
    owner: str,
    tags: List[str],
    status: str = "new",
) -> Idea:
    idea_id = _next_id()
    idea = Idea(
        id=idea_id,
        title=title,
        problem=problem,
        solution=solution,
        owner=owner,
        tags=tags,
        created_at=datetime.utcnow().isoformat(),
        status=status,
    )
    storage.write(str(IDEAS_QUEUE), asdict(idea))
    _append_backlog(idea)
    _write_lake(asdict(idea))
    metrics.emit("rnd_idea_created")
    return idea


def list(status: Optional[str] = None) -> List[Idea]:
    ideas: List[Idea] = []
    for line in storage.read(str(IDEAS_QUEUE)).splitlines():
        if line.strip():
            data = json.loads(line)
            ideas.append(Idea(**data))
    if status:
        ideas = [i for i in ideas if i.status == status]
    return ideas
