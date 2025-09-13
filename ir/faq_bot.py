from __future__ import annotations
from pathlib import Path
from typing import List
from datetime import date
from .kpi_sot import IR_ARTIFACTS, REGISTRY
from . import blackouts, kpi_signoff, disclosures
from .utils import log_metric

APPROVED_DIRS = [IR_ARTIFACTS / "public", IR_ARTIFACTS]


def _approved_files() -> List[Path]:
    files: List[Path] = []
    for d in APPROVED_DIRS:
        if d.exists():
            for p in d.rglob("*"):
                if p.is_file() and p.suffix in {".md", ".txt"}:
                    files.append(p)
    return files


def answer(q: str, mode: str = "internal", today: date | None = None, user: str = "U_IR") -> dict:
    today = today or date.today()
    if mode == "external":
        code = blackouts.status(today.isoformat())
        if code:
            return {"error": code}
        for key in REGISTRY.keys():
            if key in q.lower() and not kpi_signoff.is_approved(key):
                return {"error": "DUTY_KPI_UNAPPROVED"}
    docs = _approved_files()
    q_lower = q.lower()
    for path in docs:
        text = path.read_text()
        if any(word in text.lower() for word in q_lower.split()):
            answer = text.strip().splitlines()[0]
            sources = [str(path)]
            if mode == "external":
                disclosures.log_disclosure("faq", str(path), user)
            log_metric("ir_faq_answered")
            return {"answer": answer, "sources": sources}
    if mode == "external":
        return {"error": "NOT_APPROVED"}
    return {"answer": "No approved info", "sources": []}
