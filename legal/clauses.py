from __future__ import annotations

import yaml
from pathlib import Path
from typing import List, Dict, Any

ROOT = Path(__file__).resolve().parents[1]
CLAUSE_DIR = ROOT / "configs" / "legal" / "clauses"
TEMPLATE_DIR = ROOT / "configs" / "legal" / "templates"


def load_clauses(tag: str | None = None) -> List[Dict[str, Any]]:
    clauses: List[Dict[str, Any]] = []
    for path in CLAUSE_DIR.glob("*.yaml"):
        data = yaml.safe_load(path.read_text()) or []
        for cl in data:
            if tag and tag not in cl.get("tags", []):
                continue
            clauses.append(cl)
    return clauses


def assemble(template: str, options_path: str) -> tuple[str, List[Dict[str, str]]]:
    tfile = TEMPLATE_DIR / f"{template}.yaml"
    clause_ids: List[str] = yaml.safe_load(tfile.read_text())
    options = yaml.safe_load(Path(options_path).read_text()) or {}
    library = {c["id"]: c for c in load_clauses()}
    lines: List[str] = []
    used: List[Dict[str, str]] = []
    for cid in clause_ids:
        clause = library[cid]
        level = options.get(cid, "standard")
        text = clause["variants"][level]
        lines.append(f"## {clause['title']}")
        lines.append(text)
        used.append({"id": cid, "level": level})
    return "\n".join(lines) + "\n", used
