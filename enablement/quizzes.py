from __future__ import annotations

import json
from pathlib import Path

import yaml

from tools import storage

from .utils import ART, ROOT, lake_write, record


def _quiz_path(quiz_id: str) -> Path:
    return ROOT / "configs" / "enablement" / "quizzes" / f"{quiz_id}.yaml"


def grade(quiz_id: str, answers_file: str) -> dict:
    data = yaml.safe_load(_quiz_path(quiz_id).read_text())
    questions = {q["id"]: q["answer"] for q in data.get("questions", [])}
    pass_percent = data.get("pass_percent", 80)
    answers = json.loads(Path(answers_file).read_text())
    parts = Path(answers_file).stem.split("_")
    user = "_".join(parts[:2]) if len(parts) >= 2 else parts[0]
    correct = 0
    breakdown = {}
    for qid, answer in questions.items():
        submitted = answers.get(qid)
        is_correct = submitted == answer
        breakdown[qid] = is_correct
        if is_correct:
            correct += 1
    score = int((correct / len(questions)) * 100) if questions else 0
    result = {"score": score, "pass": score >= pass_percent, "breakdown": breakdown}
    record_data = {"user": user, "quiz": quiz_id, **result}
    storage.write(str(ART / "quizzes" / f"{user}_{quiz_id}.jsonl"), record_data)
    lake_write("quiz_attempts", record_data)
    record("quizzes_graded", 1)
    return result
