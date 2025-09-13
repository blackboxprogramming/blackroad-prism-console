from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from tools import artifacts, storage

ROOT = Path(__file__).resolve().parents[0].parents[0]
CONFIG = ROOT / "configs" / "mdm" / "catalog.yaml"
ARTIFACTS = ROOT / "artifacts" / "mdm"


def load_yaml(path: Path) -> Any:
    import yaml

    return yaml.safe_load(path.read_text())


def build(config_path: Path = CONFIG) -> List[Dict[str, Any]]:
    cfg = load_yaml(config_path)
    entries = cfg.get("entries", [])
    artifacts.validate_and_write(str(ARTIFACTS / "catalog.json"), entries, None)
    lines = ["|domain|field|type|pii|", "|---|---|---|---|"]
    for e in entries:
        lines.append(f"|{e['domain']}|{e['field']}|{e['type']}|{e.get('pii', False)}|")
    artifacts.validate_and_write(str(ARTIFACTS / "catalog.md"), "\n".join(lines), None)
    return entries

