"""Simple AI compliance and ethics monitor.

The :class:`AIGuardian` class offers a minimal interface that other
agents can call to record decisions and validate that outcomes respect
fiduciary duties and fairness guidelines.  Real deployments would hook
into bias detection libraries and maintain an auditable trail.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class DecisionRecord:
    agent: str
    action: str
    notes: str = ""


class AIGuardian:
    """Monitor actions taken by AI agents."""

    def __init__(self) -> None:
        self.records: List[DecisionRecord] = []

    def record(self, agent: str, action: str, notes: str = "") -> None:
        self.records.append(DecisionRecord(agent=agent, action=action, notes=notes))

    def detect_conflict(self, record: DecisionRecord) -> bool:
        """Naive conflict-of-interest check.

        For demonstration purposes we only flag actions that mention
        keywords such as ``"kickback"`` or ``"inside"``.
        """

        lowered = record.action.lower() + record.notes.lower()
        return any(keyword in lowered for keyword in ["kickback", "inside"])

    def recent_issues(self) -> List[DecisionRecord]:
        return [r for r in self.records if self.detect_conflict(r)]
