from __future__ import annotations

import json
from collections import Counter

from tools import artifacts, storage

from .utils import ART, lake_write, record

BANNED = {"bad"}


def add(course: str, user: str, score: int, comment: str) -> None:
    record_data = {"course": course, "user": user, "score": score, "comment": comment}
    storage.write(str(ART / "feedback" / f"{course}.jsonl"), record_data)
    lake_write("feedback", record_data)
    record("feedback_logged", 1)


def summary(course: str) -> dict:
    path = ART / "feedback" / f"{course}.jsonl"
    entries = [json.loads(line) for line in storage.read(str(path)).splitlines() if line]
    scores = [e["score"] for e in entries]
    total = len(scores)
    promoters = sum(1 for s in scores if s >= 9)
    detractors = sum(1 for s in scores if s <= 6)
    nps = int(((promoters - detractors) / total) * 100) if total else 0
    words = Counter()
    for e in entries:
        comment = e.get("comment", "")
        if any(b in comment.lower() for b in BANNED):
            continue
        words.update(w.lower() for w in comment.split())
    top = dict(words)
    summary_data = {"nps": nps, "keywords": top}
    artifacts.validate_and_write(
        str(ART / "feedback" / f"{course}_summary.md"), f"NPS: {nps}\n{top}"
    )
    return summary_data
