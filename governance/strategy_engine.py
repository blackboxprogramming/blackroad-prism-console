"""Strategic fit evaluation utilities.

This module provides a small ``StrategyEngine`` that captures
Michael Porter's view that strategy is about choosing a unique
position, making trade-offs and creating fit across a company's
activities.  The engine exposes a :class:`CorporateStrategy`
configuration and a :meth:`StrategyEngine.check_fit` helper that can be
used by other Codex agents to validate that new initiatives reinforce
the overall positioning rather than drift into operational effectiveness only.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List


@dataclass
class CorporateStrategy:
    """High level description of the company's chosen strategy.

    Attributes
    ----------
    positioning:
        The unique value proposition (e.g. ``"low cost fintech"``).
    tradeoffs:
        Activities the firm *will not* perform in order to protect the
        strategic position.
    activities:
        Core reinforcing activities that should remain aligned.
    mode:
        One of ``"cost_leadership"``, ``"differentiation"`` or ``"focus"``.
    """

    positioning: str
    tradeoffs: List[str] = field(default_factory=list)
    activities: List[str] = field(default_factory=list)
    mode: str = "differentiation"


class StrategyEngine:
    """Check projects and modules for strategic fit."""

    def __init__(self, strategy: CorporateStrategy) -> None:
        self.strategy = strategy

    def check_fit(self, activity: Dict[str, Iterable[str]]) -> List[str]:
        """Return a list of issues for the provided activity description.

        Parameters
        ----------
        activity:
            Mapping with keys ``positioning``, ``mode`` and ``activities``
            describing a proposed initiative.
        """

        issues: List[str] = []

        if activity.get("mode") and activity["mode"] != self.strategy.mode:
            issues.append(
                f"Mode mismatch: {activity['mode']} vs expected {self.strategy.mode}"
            )

        if activity.get("positioning") and activity["positioning"] != self.strategy.positioning:
            issues.append("Positioning deviates from corporate strategy")

        for act in activity.get("activities", []):
            if act in self.strategy.tradeoffs:
                issues.append(f"Activity '{act}' conflicts with strategic trade-offs")
            elif act not in self.strategy.activities:
                issues.append(f"Activity '{act}' is outside core fit")

        if not issues:
            issues.append("fit")

        return issues
