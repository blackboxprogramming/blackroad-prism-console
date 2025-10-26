"""Generate adaptive practice sets for Teacher cohorts."""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

ROOT = Path(__file__).resolve().parents[1]
QUESTION_BANK = ROOT / "datasets" / "question_bank.jsonl"
DEFAULT_SET_SIZE = 4


def load_question_bank(path: Path = QUESTION_BANK) -> List[Dict[str, Any]]:
    """Return all questions stored in the JSONL bank."""

    questions: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            questions.append(json.loads(line))
    return questions


def _difficulty_filter(bank: Iterable[Dict[str, Any]], target: float) -> List[Dict[str, Any]]:
    """Select questions with difficulty near the target."""

    window = 0.15
    return [q for q in bank if abs(float(q.get("difficulty", 0.5)) - target) <= window]


def _score_results(results: Dict[str, Any]) -> float:
    """Compute a mastery ratio from quiz results."""

    answers = results.get("answers", [])
    if not answers:
        return 0.0
    correct = sum(1 for item in answers if item.get("correct"))
    return correct / len(answers)


def next_practice_set(user: str, results: Dict[str, Any], *, now: Optional[datetime] = None) -> Dict[str, Any]:
    """Generate the next practice recommendation."""

    if now is None:
        now = datetime.utcnow()

    mastery = _score_results(results)
    target_difficulty = 0.6 if mastery >= 0.85 else 0.45
    questions = load_question_bank()
    candidates = _difficulty_filter(questions, target_difficulty) or questions
    selected = candidates[:DEFAULT_SET_SIZE]

    due = now + timedelta(hours=6 if mastery >= 0.85 else 3)
    energy = 1.0 if mastery >= 0.85 else 0.7

    return {
        "user": user,
        "mastery": mastery,
        "items": selected,
        "energy_budget": energy,
        "review_at": due.isoformat() + "Z",
    }


__all__ = ["load_question_bank", "next_practice_set"]
