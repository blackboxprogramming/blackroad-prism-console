"""Reflex hook that converts significant PRs into lesson cards."""

from __future__ import annotations

from typing import Any, Callable, Dict, List

from ..pipelines.make_lessons import pr_to_lesson_cards, write_cards

try:
    from lucidia.reflex.core import BUS, start
except ModuleNotFoundError:  # pragma: no cover - fallback for local runs.
    class _StubBus:
        """Minimal stub to allow offline testing."""

        def __init__(self) -> None:
            self.handlers: Dict[str, List[Callable[[Dict[str, Any]], None]]] = {}

        def on(self, topic: str) -> Callable[[Callable[[Dict[str, Any]], None]], Callable[[Dict[str, Any]], None]]:
            def decorator(func: Callable[[Dict[str, Any]], None]) -> Callable[[Dict[str, Any]], None]:
                self.handlers.setdefault(topic, []).append(func)
                return func

            return decorator

        def emit(self, topic: str, payload: Dict[str, Any]) -> None:
            for handler in self.handlers.get(topic, []):
                handler(payload)

    BUS = _StubBus()

    def start() -> None:  # pragma: no cover - not used in offline tests.
        raise RuntimeError("lucidia.reflex.core is not installed")


SIGNIFICANT_LINES = 60


@BUS.on("git:pr_merged")
def build_lessons(event: Dict[str, Any]) -> None:
    """Build lesson cards for significant pull requests."""

    if int(event.get("lines_changed", 0)) < SIGNIFICANT_LINES:
        return

    cards = pr_to_lesson_cards(event)
    paths = write_cards(cards)
    for card, path in zip(cards, paths):
        BUS.emit(
            "teacher:lesson.created",
            {"id": card["id"], "path": str(path)},
        )


if __name__ == "__main__":
    start()
