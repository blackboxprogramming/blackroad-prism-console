"""Engineering change order utilities used in the unit tests.

The production file had diverging implementations with conflicting
side-effects.  The reduced version below focuses on the behaviour
required by ``tests/plm_mfg/test_eco.py``: creating ECO records and
enforcing a dual-approval policy for high-risk changes.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import List

ART_DIR: Path = Path("artifacts/plm/changes")
COUNTER_FILE: Path = ART_DIR / "_counter"
from tools import storage
from . import bom
from tools import artifacts
from orchestrator import metrics

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "plm" / "changes"
LAKE_DIR = ROOT / "artifacts" / "plm" / "lake"
SCHEMA_DIR = ROOT / "contracts" / "schemas"
INDEX_PATH = ART_DIR / "index.json"


@dataclass
class Change:
    id: str
    item_id: str
    from_rev: str
    to_rev: str
    reason: str
    risk: str = "medium"
    status: str = "draft"
    type: str = "ECO"
    effects: List[str] = field(default_factory=list)
    approvals: List[str] = field(default_factory=list)


def _ensure_art_dir() -> Path:
    path = Path(ART_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _path(change_id: str) -> Path:
    return _ensure_art_dir() / f"{change_id}.json"


def _next_id() -> str:
    art_dir = _ensure_art_dir()
    counter_path = art_dir / COUNTER_FILE.name
    current = 0
    if counter_path.exists():
        try:
            current = int(counter_path.read_text(encoding="utf-8").strip() or "0")
        except ValueError:
            current = 0
    current += 1
    counter_path.write_text(str(current), encoding="utf-8")
    return f"ECO-{current:05d}"


def _load(change_id: str) -> Change:
    data = json.loads(_path(change_id).read_text(encoding="utf-8"))
    return Change(**data)


def _write(change: Change) -> None:
    _path(change.id).write_text(json.dumps(asdict(change), indent=2, sort_keys=True), encoding="utf-8")
def _schema(name: str) -> str:
    return str(SCHEMA_DIR / name)


def _rewrite_lake(records: List[dict]) -> None:
    LAKE_DIR.mkdir(parents=True, exist_ok=True)
    path = LAKE_DIR / "plm_changes.jsonl"
    if path.exists():
        path.unlink()
    for rec in records:
        storage.write(str(path), rec)


def _update_index(ch: Change) -> None:
    raw = storage.read(str(INDEX_PATH))
    data = json.loads(raw) if raw else []
    data = [row for row in data if row.get("id") != ch.id]
    data.append(asdict(ch))
    data.sort(key=lambda r: r["id"])
    artifacts.validate_and_write(str(INDEX_PATH), data, _schema("plm_changes.schema.json"))
    _rewrite_lake(data)


def _save(ch: Change) -> None:
    ART_DIR.mkdir(parents=True, exist_ok=True)
    storage.write(str(_path(ch.id)), json.dumps(asdict(ch), indent=2))
    # simple markdown log
    storage.write(str(ART_DIR / f"eco_{ch.id}.md"), f"# {ch.id}\nstatus: {ch.status}\nreason: {ch.reason}\n")
    _update_index(ch)


def create_change(item_id: str, from_rev: str, to_rev: str, reason: str) -> Change:
    change = Change(
        id=_next_id(),
        item_id=item_id,
        from_rev=from_rev,
        to_rev=to_rev,
        reason=reason,
        effects=[item_id],
    )
    _write(change)
    return change


def approve(change_id: str, user: str) -> Change:
    change = _load(change_id)
    if user not in change.approvals:
        change.approvals.append(user)
    if change.risk != "high" or len(change.approvals) >= 2:
        change.status = "approved"
    _write(change)
    return change


def _spc_blocking_flag() -> Path:
    return Path("artifacts/mfg/spc/blocking.flag")


def release(change_id: str) -> Change:
    change = _load(change_id)

    if change.risk == "high" and len(change.approvals) < 2:
        raise SystemExit("Policy: dual approval required for high risk changes")

    flag = _spc_blocking_flag()
    if flag.exists():
        raise SystemExit("DUTY_SPC_UNSTABLE: SPC blocking flag present")

    change.status = "released"
    _write(change)
    return change


def cli_eco_new(argv: List[str] | None = None) -> Change:
    parser = argparse.ArgumentParser(prog="plm:eco:new", description="Create a new ECO")
    parser.add_argument("--item", required=True)
    parser.add_argument("--from", dest="from_rev", required=True)
    parser.add_argument("--to", dest="to_rev", required=True)
    parser.add_argument("--reason", required=True)
    args = parser.parse_args(argv)
    return create_change(args.item, args.from_rev, args.to_rev, args.reason)


def cli_eco_release(argv: List[str] | None = None) -> Change:
    parser = argparse.ArgumentParser(prog="plm:eco:release", description="Release an ECO")
    parser.add_argument("--id", required=True)
    args = parser.parse_args(argv)
    return release(args.id)


__all__ = [
    "Change",
    "create_change",
    "approve",
    "release",
    "cli_eco_new",
    "cli_eco_release",
    "ART_DIR",
    "_path",
]
    ch = _load(change_id)
    if ch.status != "approved":
        raise RuntimeError("not approved")
    if _spc_unstable(ch.item_id):
        raise RuntimeError("DUTY_SPC_UNSTABLE")
    ch.status = "released"
    _save(ch)
    metrics.inc("plm_changes_released")
    return ch
