from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List

from tools import storage, artifacts
from . import NOTES_DIR, ARTIFACTS, LAKE

INDEX_PATH = ARTIFACTS / "notes" / "index.json"
CATALOG_PATH = ARTIFACTS / "notes" / "catalog.md"
LINKS_PATH = ARTIFACTS / "notes" / "links.json"
LAKE_TABLE = LAKE / "rnd_notes_index.json"
SCHEMA = "contracts/schemas/rnd_notes_index.json"
PII_RE = re.compile(r"[\w.]+@[\w.]+")


def index() -> Dict[str, List[str]]:
    notes = {}
    inverted: Dict[str, List[str]] = {}
    for note in NOTES_DIR.glob("*.md"):
        text = note.read_text(encoding="utf-8")
        if PII_RE.search(text) and not (ARTIFACTS / "notes" / "privacy.ok").exists():
            raise RuntimeError("DUTY_PRIVACY_RND")
        words = set(re.findall(r"[a-zA-Z]+", text.lower()))
        tags = []
        for line in text.splitlines():
            if line.startswith("tags:"):
                tags = [t.strip() for t in line.split(":", 1)[1].split(",") if t.strip()]
                break
        rel = str(note.relative_to(Path.cwd()))
        notes[rel] = {"tags": tags}
        for w in words:
            inverted.setdefault(w, []).append(rel)
    artifacts.validate_and_write(str(INDEX_PATH), {"index": inverted, "notes": notes}, SCHEMA)
    rows = ["| note | tags |", "|---|---|"]
    for path, meta in sorted(notes.items()):
        rows.append(f"| {path} | {', '.join(meta['tags'])} |")
    storage.write(str(CATALOG_PATH), "\n".join(rows) + "\n")
    artifacts.validate_and_write(str(LAKE_TABLE), {"index": inverted}, SCHEMA)
    return inverted


def link(idea_id: str, note_path: str) -> None:
    data = json.loads(storage.read(str(LINKS_PATH)) or "{}")
    data.setdefault(idea_id, []).append(note_path)
    artifacts.validate_and_write(str(LINKS_PATH), data)
