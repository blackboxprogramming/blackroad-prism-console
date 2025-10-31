"""Reflex hook adapting practice sets after quizzes."""

from __future__ import annotations

from typing import Any, Dict

from ..pipelines.make_practice import next_practice_set

try:
    from lucidia.reflex.core import BUS, start
except ModuleNotFoundError:  # pragma: no cover - fallback for local runs.
    from .on_pr_merged.reflex import BUS, start  # type: ignore


def _user_identifier(event: Dict[str, Any]) -> str:
    """Return the identifier used for practice routing."""

    return event.get("user") or event.get("email") or "unknown"


@BUS.on("teacher:quiz.submitted")
def adapt_path(event: Dict[str, Any]) -> None:
    """Emit the next practice set for a learner."""

    user = _user_identifier(event)
    results = event.get("results", {})
    practice = next_practice_set(user, results)
    BUS.emit("teacher:practice.next", {"user": user, "set": practice})


if __name__ == "__main__":
    start()
