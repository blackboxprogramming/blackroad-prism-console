from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any

from tools import artifacts, storage

ROOT = Path(__file__).resolve().parents[0].parents[0]
ARTIFACTS = ROOT / "artifacts" / "mdm"


def _norm_text(val: str) -> str:
    return val.strip().casefold()


def _norm_phone(val: str) -> str:
    digits = ''.join(ch for ch in val if ch.isdigit())
    return digits


def normalize_row(row: Dict[str, str]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in row.items():
        if v is None:
            out[k] = v
            continue
        if k in {"phone", "phone_number"}:
            out[k] = _norm_phone(v)
        else:
            out[k] = _norm_text(v)
    return out


@dataclass
class StagedSet:
    domain: str
    rows: List[Dict[str, Any]]

    def to_json(self) -> Dict[str, Any]:
        return {"domain": self.domain, "rows": self.rows}


def stage(domain: str, file: Path) -> StagedSet:
    with open(file, "r", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        rows = [normalize_row(r) for r in reader]
    data = StagedSet(domain=domain, rows=rows)
    out_path = ARTIFACTS / "staged" / f"{domain}.json"
    artifacts.validate_and_write(str(out_path), data.to_json(), None)
    return data

