"""Reflex hook that proposes a mission when a goal intent arrives."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.make_mission import propose


@BUS.on("intent:goal")
def propose_mission(event: dict) -> None:
    """Build and emit a mission canvas for the provided goal intent."""
    plan = propose(event)
    BUS.emit("strat:mission.proposed", plan)


if __name__ == "__main__":  # pragma: no cover
    start()
