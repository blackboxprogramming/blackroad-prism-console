from __future__ import annotations

import json
import re
from datetime import date
from html import escape
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
        if not path:
            continue
        total_modules = sum(course_modules.get(cid, 0) for cid in path["courses"])
        completed = sum(1 for v in a.get("progress", {}).values() if v)
        percent = int((completed / total_modules) * 100) if total_modules else 0
        overdue = today > a["due_date"] and percent < path["required_percent"]
        readiness[user] = {
            "path": a["path_id"],
            "percent_complete": percent,
            "overdue": overdue,
            "rationale": a.get("rationale", ""),
            "model_version": a.get("model_version", ""),
        }
    md_lines = ["# Readiness"]
    for user, data in readiness.items():
        why = data["rationale"] or "(no rationale recorded)"
        md_lines.append(
            f"- {user}: {data['percent_complete']}% (overdue={data['overdue']}) — Why: {why} [model={data['model_version'] or 'unknown'}]"
        )
    md = "\n".join(md_lines)
    artifacts.validate_and_write(str(ART / "readiness.md"), md)

    def _slug(value: str) -> str:
        return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "entry"

    html_lines = [
        "<html><head><meta charset=\"utf-8\" /><title>Readiness</title>",
        "<style>body{font-family:system-ui;background:#0f172a;color:#fff;padding:24px;}ul{list-style:none;padding:0;}li{margin-bottom:12px;padding:12px;border:1px solid rgba(255,255,255,0.1);border-radius:12px;background:rgba(15,23,42,0.6);}button.why{margin-left:12px;padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;}button.why:focus{outline:2px solid #38bdf8;}div.panel{margin-top:8px;padding:8px;border-radius:8px;background:rgba(56,189,248,0.1);display:none;}div.panel span.meta{display:block;font-size:12px;opacity:0.7;margin-top:4px;}</style>",
        "</head><body>",
        "<h1>Readiness</h1>",
        "<ul>",
    ]
    for user, data in readiness.items():
        panel_id = f"why-{_slug(user)}"
        rationale = escape(data["rationale"] or "(no rationale recorded)")
        summary = escape(f"{user}: {data['percent_complete']}% (overdue={data['overdue']})")
        model = escape(data["model_version"] or "unknown")
        html_lines.append(
            "<li><span>"
            + summary
            + f"</span><button class=\"why\" data-target=\"{panel_id}\">Why?</button>"
            + f"<div class=\"panel\" id=\"{panel_id}\"><p>{rationale}</p>"
            + f"<span class=\"meta\">Model version: {model}</span></div></li>"
        )
    html_lines.extend(
        [
            "</ul>",
            "<script>document.querySelectorAll('button.why').forEach(btn=>{btn.addEventListener('click',()=>{const panel=document.getElementById(btn.dataset.target);if(panel){panel.style.display=panel.style.display==='none'||!panel.style.display?'block':'none';}});});</script>",
            "</body></html>",
        ]
    )
    html = "".join(html_lines)
    artifacts.validate_and_write(str(ART / "readiness.html"), html)
    record("readiness_built", 1)
    return readiness
