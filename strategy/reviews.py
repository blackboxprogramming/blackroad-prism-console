from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import List

import yaml

from tools import storage, metrics
from . import utils


@dataclass
class Review:
    date: str
    agenda: List[str]


CFG_PATH = Path("configs/strategy/rhythm.yaml")


def _load_cfg() -> dict:
    if CFG_PATH.exists():
        return yaml.safe_load(storage.read(str(CFG_PATH)))
    return {}


def prepare(date: str) -> Review:
    cfg = _load_cfg()
    agenda = cfg.get("weekly", [])
    out_dir = utils.ARTIFACTS / f"review_{date}"
    utils._ensure_dir(out_dir / "tmp")
    storage.write(str(out_dir / "agenda.md"), "\n".join(["# Agenda"] + [f"- {a}" for a in agenda]))
    metrics.emit("reviews_prepared")
    utils.validate_and_write("reviews", {"date": date, "agenda": agenda})
    return Review(date=date, agenda=agenda)


def packet(date: str) -> Path:
    out_dir = utils.ARTIFACTS / f"review_{date}"
    # approvals
    if not (out_dir / "CFO.approved").exists() or not (out_dir / "COO.approved").exists():
        raise RuntimeError("approvals missing")
    storage.write(str(out_dir / "packet.md"), "# Review Packet\n")
    metrics.emit("reviews_prepared")
    return out_dir / "packet.md"
