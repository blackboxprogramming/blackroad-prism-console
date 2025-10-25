"""Reflex hook to narrate significant PR merges."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.render_episode import render_from_pr


@BUS.on("git:pr_merged")
def narrate_pr(event: dict) -> None:
    """Generate an episode when a PR above the threshold merges."""

    if int(event.get("lines_changed", 0)) < event.get("threshold", 50):
        return
    render_from_pr(event)


if __name__ == "__main__":  # pragma: no cover
    start()
