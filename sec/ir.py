from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List

from . import utils


@dataclass
class Incident:
    id: str
    title: str
    severity: str
    status: str
    detections: List[str]
    timeline: List[str]
    assignments: List[str]
    sig: str | None = None


INCIDENT_FILE = utils.ARTIFACT_DIR / "incidents.jsonl"


def _next_id() -> str:
    if not INCIDENT_FILE.exists():
        return "I001"
    lines = [l for l in INCIDENT_FILE.read_text().splitlines() if l.strip()]
    if not lines:
        return "I001"
    last = json.loads(lines[-1])
    num = int(last["id"][1:]) + 1
    return f"I{num:03d}"


def _write_incidents(incidents: List[Incident]) -> None:
    with INCIDENT_FILE.open("w", encoding="utf-8") as f:
        for inc in incidents:
            data = asdict(inc)
            body = {k: v for k, v in data.items() if k != "sig"}
            sig = hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()
            data["sig"] = sig
            f.write(json.dumps(data) + "\n")


def _load_all() -> List[Incident]:
    if not INCIDENT_FILE.exists():
        return []
    incs: List[Incident] = []
    with INCIDENT_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                incs.append(Incident(**json.loads(line)))
    return incs


def open_from_detections(det_paths: List[Path]) -> Incident:
    detections: List[str] = []
    severity_order = ["low", "medium", "high", "critical"]
    sev_index = 0
    for path in det_paths:
        for d in utils.read_json(path):
            detections.append(d["rule"])
            idx = severity_order.index(d["severity"])
            if idx > sev_index:
                sev_index = idx
    incident = Incident(
        id=_next_id(),
        title="Incident",
        severity=severity_order[sev_index],
        status="open",
        detections=detections,
        timeline=[],
        assignments=[],
    )
    incs = _load_all()
    incs.append(incident)
    _write_incidents(incs)
    utils.record_metric("sec_incident_opened")
    return incident


def assign(id: str, user: str) -> Incident:
    incs = _load_all()
    for inc in incs:
        if inc.id == id:
            inc.assignments.append(user)
            inc.status = "assigned"
            _write_incidents(incs)
            return inc
    raise ValueError("incident not found")


def add_timeline(id: str, event: str) -> Incident:
    incs = _load_all()
    for inc in incs:
        if inc.id == id:
            inc.timeline.append(event)
            _write_incidents(incs)
            return inc
    raise ValueError("incident not found")


def resolve(id: str, resolution: str) -> Incident:
    incs = _load_all()
    for inc in incs:
        if inc.id == id:
            if inc.severity == "critical" and not any(
                "contained" in e.lower() for e in inc.timeline
            ):
                raise ValueError("critical incident must be contained before resolve")
            inc.status = "resolved"
            inc.timeline.append(resolution)
            _write_incidents(incs)
            return inc
    raise ValueError("incident not found")
