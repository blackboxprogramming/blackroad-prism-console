from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import yaml

from tools import storage, metrics, artifacts
from . import ARTIFACTS, LAKE, CONFIGS

CONFIG_PATH = CONFIGS / "radar.yaml"
LAKE_TABLE = LAKE / "rnd_radar.json"
SCHEMA = "contracts/schemas/rnd_radar.json"
ALLOWED_RINGS = {"Adopt", "Trial", "Assess", "Hold"}
ALLOWED_QUADRANTS = {"Languages", "Platforms", "Tools", "Techniques"}


@dataclass
class RadarEntry:
    tech: str
    ring: str
    quadrant: str
    rationale: str
    owner: str
    last_review: str


def _load() -> List[RadarEntry]:
    if CONFIG_PATH.exists():
        data = yaml.safe_load(storage.read(str(CONFIG_PATH))) or []
    else:
        data = []
    return [RadarEntry(**d) for d in data]


def _save(entries: List[RadarEntry]) -> None:
    yaml_data = [asdict(e) for e in entries]
    storage.write(str(CONFIG_PATH), yaml.dump(yaml_data))


def add(tech: str, ring: str, quadrant: str, rationale: str, owner: str = "cli") -> None:
    if ring not in ALLOWED_RINGS or quadrant not in ALLOWED_QUADRANTS:
        raise ValueError("invalid ring/quadrant")
    entries = _load()
    entry = RadarEntry(
        tech=tech,
        ring=ring,
        quadrant=quadrant,
        rationale=rationale,
        owner=owner,
        last_review=datetime.utcnow().date().isoformat(),
    )
    entries.append(entry)
    _save(entries)


def build() -> None:
    entries = _load()
    for e in entries:
        if e.ring not in ALLOWED_RINGS or e.quadrant not in ALLOWED_QUADRANTS:
            raise ValueError("invalid entry")
    entries.sort(key=lambda x: x.tech.lower())
    rows = ["| tech | ring | quadrant | owner | last_review |", "|---|---|---|---|---|"]
    for e in entries:
        rows.append(f"| {e.tech} | {e.ring} | {e.quadrant} | {e.owner} | {e.last_review} |")
    md = "\n".join(rows) + "\n"
    md_path = ARTIFACTS / "radar.md"
    storage.write(str(md_path), md)
    html = "<html><body><pre>" + md + "</pre></body></html>"
    storage.write(str(ARTIFACTS / "radar.html"), html)
    json_data = [asdict(e) for e in entries]
    artifacts.validate_and_write(str(ARTIFACTS / "radar.json"), json_data)
    artifacts.validate_and_write(str(LAKE_TABLE), json_data, SCHEMA)
    metrics.emit("rnd_radar_built")


def list(quadrant: Optional[str] = None) -> List[RadarEntry]:
    entries = _load()
    if quadrant:
        entries = [e for e in entries if e.quadrant == quadrant]
    return entries
