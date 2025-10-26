"""Guardian flag reflex for Codex-26."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start

from ..pipelines.disambiguate import clarify


@BUS.on("guardian:contradiction")
def nudge(event: dict) -> None:
    """Emit a gentle clarifier question for the Guardian."""
    context = event.get("context", "")
    question = clarify(context)
    BUS.emit("msg:clarifier", {"question": question, "emoji": "❓"})


if __name__ == "__main__":  # pragma: no cover
    start()
