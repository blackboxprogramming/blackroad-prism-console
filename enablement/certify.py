from __future__ import annotations

import json
from pathlib import Path
from typing import List

import yaml

from tools import artifacts, storage

from .utils import ART, ROOT, lake_write, record


def _cert_path(cert_id: str) -> Path:
    return ROOT / "configs" / "enablement" / "certs" / f"{cert_id}.yaml"


def _read_jsonl(path: Path) -> List[dict]:
    if not path.exists():
        return []
    lines = storage.read(str(path)).strip().splitlines()
    return [json.loads(line) for line in lines if line]


def check(user: str, cert_id: str) -> bool:
    cfg = yaml.safe_load(_cert_path(cert_id).read_text())
    quizzes = cfg.get("quizzes", [])
    labs = cfg.get("labs", [])
    min_score = cfg.get("min_score", 80)
    for q in quizzes:
        attempts = _read_jsonl(ART / "quizzes" / f"{user}_{q}.jsonl")
        if not attempts or attempts[-1]["score"] < min_score:
            return False
    for lab_id in labs:
        res_path = ART / "labs" / f"{user}_{lab_id}" / "result.json"
        res_raw = storage.read(str(res_path))
        if not res_raw:
            return False
        res = json.loads(res_raw)
        if res.get("override") and not res.get("reviewer"):
            return False
        if not res.get("passed"):
            return False
    cert_file = ART / "certs" / f"{user}.json"
    existing = json.loads(storage.read(str(cert_file)) or "[]")
    if cert_id not in existing:
        existing.append(cert_id)
        artifacts.validate_and_write(str(cert_file), existing)
        lake_write("cert_awards", {"user": user, "cert": cert_id})
        record("certs_awarded", 1)
    return True


def list_user(user: str) -> List[str]:
    cert_file = ART / "certs" / f"{user}.json"
    return json.loads(storage.read(str(cert_file)) or "[]")
