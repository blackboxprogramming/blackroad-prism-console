from __future__ import annotations
from pathlib import Path
from typing import List
import json
import re

from .utils import IR_ARTIFACTS
from . import blackouts, disclosures, kpi_signoff, kpi_sot

APPROVED_DIRS = [IR_ARTIFACTS]


def _approved_docs() -> List[Path]:
    docs: List[Path] = []
    for d in APPROVED_DIRS:
        if d.exists():
            docs.extend(d.rglob("*.md"))
    return docs


def _is_signed_off(kpi: str) -> bool:
    path = kpi_signoff.SIGNOFF_PATH
    if not path.exists():
        return False
    for line in path.read_text().splitlines():
        rec = json.loads(line)
        if rec["kpi"] == kpi and rec["status"] == "approved":
            return True
    return False


def answer(q: str, mode: str = "internal", user: str = "U_IR") -> dict:
    if mode == "external":
        blackouts.enforce("faq")
        for k in kpi_sot._registry.keys():
            if k in q.lower() and not _is_signed_off(k):
                return {"error": "DUTY_KPI_UNAPPROVED"}
    tokens = [t for t in re.findall(r"[a-z0-9]+", q.lower()) if t not in {"what", "is", "the"}]
    for doc in _approved_docs():
        text = doc.read_text().lower()
        rel = [tok for tok in tokens if tok in text]
        if rel:
            answer = "".join(text.splitlines()[:1])
            if mode == "external":
                disclosures.log_content("faq", answer, user)
            return {"answer": answer, "sources": [str(doc)]}
    if mode == "external":
        return {"error": "DUTY_KPI_UNAPPROVED"}
    return {"answer": "No approved information", "sources": []}
