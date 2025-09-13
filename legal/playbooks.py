from __future__ import annotations

import yaml
from pathlib import Path
from typing import Dict, Any


def load_playbook(path: str) -> Dict[str, Any]:
    return yaml.safe_load(Path(path).read_text()) or {}


def allowed_variants(playbook: Dict[str, Any], clause_id: str) -> list[str]:
    clause = playbook.get("clauses", {}).get(clause_id, {})
    return clause.get("allowed", ["standard"])
