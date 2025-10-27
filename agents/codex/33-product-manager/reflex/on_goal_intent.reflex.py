"""Reflex hook: goal intent → outcome tree + bets."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.make_outcome_tree import build
from ..pipelines.open_bet import attach_bets, open_bets


@BUS.on("intent:goal")
def spin(event: dict) -> None:
    """Generate the first outcome tree and opening bets."""
    tree = build(event)
    bets = open_bets(tree)
    enriched_tree = attach_bets(tree, bets)
    BUS.emit("pm:outcomes.ready", {"tree": enriched_tree, "bets": bets})


if __name__ == "__main__":  # pragma: no cover
    start()
