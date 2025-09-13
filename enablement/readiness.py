from __future__ import annotations

import json
from datetime import date
from typing import Dict

from tools import artifacts, storage

from .utils import ART, record


def build() -> dict:
    courses = json.loads(storage.read(str(ART / "courses.json")) or "[]")
    paths = {p["id"]: p for p in json.loads(storage.read(str(ART / "paths.json")) or "[]")}
    assignments = json.loads(storage.read(str(ART / "assignments.json")) or "[]")

    course_modules = {c["id"]: len(c.get("modules", [])) for c in courses}

    readiness: Dict[str, dict] = {}
    today = date.today().isoformat()

    for a in assignments:
        user = a["user_id"]
        path = paths.get(a["path_id"])
        total_modules = sum(course_modules.get(cid, 0) for cid in path["courses"])
        completed = sum(1 for v in a.get("progress", {}).values() if v)
        percent = int((completed / total_modules) * 100) if total_modules else 0
        overdue = today > a["due_date"] and percent < path["required_percent"]
        readiness[user] = {
            "path": a["path_id"],
            "percent_complete": percent,
            "overdue": overdue,
        }
    md_lines = ["# Readiness"]
    for user, data in readiness.items():
        md_lines.append(f"- {user}: {data['percent_complete']}% (overdue={data['overdue']})")
    md = "\n".join(md_lines)
    artifacts.validate_and_write(str(ART / "readiness.md"), md)
    html = "<html><body><pre>" + md + "</pre></body></html>"
    artifacts.validate_and_write(str(ART / "readiness.html"), html)
    record("readiness_built", 1)
    return readiness
