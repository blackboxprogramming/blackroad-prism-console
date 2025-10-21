from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Dict

import yaml

from tools import storage
from . import catalog

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "partners" / "certifications.json"


@dataclass
class Exam:
    id: str
    name: str
    objectives: List[str]
    passing: int
    questions: Dict[str, str]


@dataclass
class Attempt:
    partner_id: str
    exam_id: str
    score: int
    status: str


def _load_artifacts() -> List[Dict]:
    raw = storage.read(str(ART))
    return json.loads(raw) if raw else []


def _save_artifacts(attempts: List[Dict]) -> None:
    import json

    storage.write(str(ART), json.dumps(attempts))


def load_exam(exam_id: str) -> Exam:
    path = ROOT / "fixtures" / "partners" / "exams" / f"{exam_id}.yaml"
    data = yaml.safe_load(Path(path).read_text())
    return Exam(
        id=exam_id,
        name=data.get("name", exam_id),
        objectives=data.get("objectives", []),
        passing=int(data.get("passing", 0)),
        questions=data.get("questions", {}),
    )


def grade(partner_id: str, exam_id: str, answers_path: Path) -> Attempt:
    exam = load_exam(exam_id)
    answers = json.loads(Path(answers_path).read_text())
    score = 0
    for q, correct in exam.questions.items():
        if answers.get(q) == correct:
            score += 1
    status = "passed" if score >= exam.passing else "failed"
    attempt = Attempt(partner_id, exam_id, score, status)
    attempts = _load_artifacts()
    attempts.append(asdict(attempt))
    _save_artifacts(attempts)
    # update partner certs
    if status == "passed":
        cat = catalog._load_catalog_from_artifacts()
        for p in cat.get("partners", []):
            if p.get("id") == partner_id and exam_id not in p.get("certs", []):
                p.setdefault("certs", []).append(exam_id)
        storage.write(str(catalog.ARTIFACTS / "catalog.json"), cat)
    return attempt


def status(partner_id: str) -> List[Dict]:
    return [a for a in _load_artifacts() if a.get("partner_id") == partner_id]
