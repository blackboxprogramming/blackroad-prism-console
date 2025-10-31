"""Build mastery dashboards and KPIs for Teacher cohorts."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List

ROOT = Path(__file__).resolve().parents[1]
REPORTS_DIR = ROOT / "reports" / "mastery"


@dataclass
class CohortStat:
    """Aggregated telemetry for a cohort."""

    name: str
    learners: int
    mastery_avg: float
    learning_per_joule: float


def compute_learning_per_joule(sessions: Iterable[Dict[str, Any]]) -> float:
    """Compute mastery delta per joule consumed."""

    total_delta = 0.0
    total_energy = 0.0
    for session in sessions:
        total_delta += float(session.get("mastery_delta", 0.0))
        total_energy += float(session.get("energy", 0.0))
    if total_energy == 0:
        return 0.0
    return total_delta / total_energy


def summarise_cohort(name: str, records: List[Dict[str, Any]]) -> CohortStat:
    """Return a CohortStat from raw learner records."""

    learners = max(1, len(records))
    mastery_total = sum(float(item.get("mastery", 0.0)) for item in records)
    sessions = [session for item in records for session in item.get("sessions", [])]
    lpj = compute_learning_per_joule(sessions)
    return CohortStat(name=name, learners=learners, mastery_avg=mastery_total / learners, learning_per_joule=lpj)


def build_report(cohorts: Dict[str, List[Dict[str, Any]]], *, generated_at: datetime | None = None) -> Dict[str, Any]:
    """Create a serialisable mastery report."""

    if generated_at is None:
        generated_at = datetime.utcnow()

    stats = [summarise_cohort(name, data) for name, data in cohorts.items()]
    return {
        "generated_at": generated_at.isoformat() + "Z",
        "cohorts": [
            {
                "name": stat.name,
                "learners": stat.learners,
                "mastery_avg": round(stat.mastery_avg, 3),
                "learning_per_joule": round(stat.learning_per_joule, 3),
            }
            for stat in stats
        ],
    }


def save_report(report: Dict[str, Any], directory: Path = REPORTS_DIR) -> Path:
    """Persist the report to disk."""

    directory.mkdir(parents=True, exist_ok=True)
    timestamp = report.get("generated_at", datetime.utcnow().isoformat())
    filename = f"mastery-{timestamp.replace(':', '').replace('-', '')}.json"
    path = directory / filename
    with path.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2, sort_keys=True)
    return path


__all__ = ["CohortStat", "build_report", "compute_learning_per_joule", "save_report", "summarise_cohort"]
