"""Hybrid project portfolio controller.

This module introduces a lightweight ``PortfolioController`` that can
collect project proposals, score them and prioritise execution while
keeping a link to the strategic objectives defined elsewhere in the
platform.  The implementation is intentionally small but provides hooks
for predictive, agile and design-thinking approaches as required by the
Handbook of Project Management.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class Project:
    name: str
    strategic_value: float
    risk: float
    sustainable: bool = True


class PortfolioController:
    """Manage a portfolio of projects and provide simple prioritisation."""

    def __init__(self) -> None:
        self.projects: List[Project] = []

    def add_project(self, project: Project) -> None:
        self.projects.append(project)

    def prioritise(self) -> List[Project]:
        """Return projects sorted by a naive risk-adjusted value.

        A real implementation would incorporate machine learning and a
        full portfolio optimisation model.  Here we simply rank by
        ``strategic_value / (1 + risk)``.
        """

        return sorted(
            self.projects,
            key=lambda p: p.strategic_value / (1.0 + p.risk),
            reverse=True,
        )
