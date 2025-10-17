from __future__ import annotations
import hashlib, json
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List
from tools import storage, metrics, artifacts
from . import ARTIFACTS, LAKE

COUNTER = ARTIFACTS / "last_disclosure_id.txt"
LAKE_TABLE = LAKE / "rnd_ip.json"
SCHEMA = "contracts/schemas/rnd_ip.json"

@dataclass
class Disclosure:
    id: str
    idea_id: str
    title: str
    inventors: List[str]
    prior_art: List[str]
    jurisdictions: List[str]
    status: str
    created_at: str
    hash: str


def _next_id() -> str:
    last = int(storage.read(str(COUNTER)) or 0)
    new = last + 1
    storage.write(str(COUNTER), str(new))
    return f"D{new:03d}"


def _hash(data: dict) -> str:
    content = json.dumps(data, sort_keys=True)
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _write(disclosure: Disclosure) -> None:
    path = ARTIFACTS / "ip" / f"{disclosure.id}.json"
    artifacts.validate_and_write(str(path), asdict(disclosure))


def _append_lake(disclosure: Disclosure) -> None:
    existing = json.loads(storage.read(str(LAKE_TABLE)) or "[]")
    existing = [d for d in existing if d.get("id") != disclosure.id]
    existing.append(asdict(disclosure))
    artifacts.validate_and_write(str(LAKE_TABLE), existing, SCHEMA)


def new(idea_id: str, title: str, inventors: List[str], jurisdictions: List[str], prior_art: List[str] | None = None) -> Disclosure:
    disc_id = _next_id()
    data = {
        "id": disc_id,
        "idea_id": idea_id,
        "title": title,
        "inventors": inventors,
        "prior_art": prior_art or [],
        "jurisdictions": jurisdictions,
        "status": "draft",
        "created_at": datetime.utcnow().isoformat(),
    }
    data["hash"] = _hash(data)
    disclosure = Disclosure(**data)
    _write(disclosure)
    _append_lake(disclosure)
    metrics.emit("rnd_ip_logged")
    _append_docket(disclosure)
    return disclosure


def _append_docket(disclosure: Disclosure) -> None:
    path = ARTIFACTS / "ip" / "dockets.md"
    header = "| id | idea | title | status |\n|---|---|---|---|\n"
    if not path.exists():
        storage.write(str(path), header)
    row = f"| {disclosure.id} | {disclosure.idea_id} | {disclosure.title} | {disclosure.status} |\n"
    with open(path, "a", encoding="utf-8") as fh:
        fh.write(row)


def update(disc_id: str, status: str) -> None:
    path = ARTIFACTS / "ip" / f"{disc_id}.json"
    data = json.loads(storage.read(str(path)))
    if status == "filed" and not (ARTIFACTS / "ip" / "legal_ok.txt").exists():
        raise RuntimeError("LEGAL_APPROVAL_REQUIRED")
    data["status"] = status
    data["hash"] = _hash(data)
    disclosure = Disclosure(**data)
    _write(disclosure)
    _append_lake(disclosure)
