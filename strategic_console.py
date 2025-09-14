"""BlackRoad Strategic Console.

A very small command line dashboard that stitches together the
specialised governance modules.  It is not interactive but illustrates
how board members could obtain a high level overview of strategic fit,
financial plans and ethical alerts.
"""

from __future__ import annotations

from governance.strategy_engine import CorporateStrategy, StrategyEngine
from pm.portfolio_controller import PortfolioController, Project
from ethics.ai_guardian import AIGuardian


def sample_dashboard() -> None:
    strategy = CorporateStrategy(
        positioning="AI-first fintech",
        tradeoffs=["on-premise"],
        activities=["cloud", "ml"],
        mode="differentiation",
    )
    engine = StrategyEngine(strategy)
    controller = PortfolioController()
    guardian = AIGuardian()

    controller.add_project(Project("ML risk model", strategic_value=10, risk=2))
    controller.add_project(Project("Legacy cleanup", strategic_value=3, risk=1))

    guardian.record("agent1", "recommended insider trade", notes="inside tip")

    print("Strategic check:", engine.check_fit({"mode": "differentiation", "positioning": "AI-first fintech", "activities": ["cloud"]}))
    print("Portfolio order:", [p.name for p in controller.prioritise()])
    print("AI issues:", [r.action for r in guardian.recent_issues()])


if __name__ == "__main__":
    sample_dashboard()
