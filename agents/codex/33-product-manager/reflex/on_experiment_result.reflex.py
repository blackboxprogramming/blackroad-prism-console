"""Reflex hook: experiment result → decide bet."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.decide_bet import decide


@BUS.on("experiment:result")
def decide_bet(event: dict) -> None:
    """Emit the bet decision with receipts."""
    result = decide(event)
    BUS.emit(f"pm:bet.{result['decision']}", result)


if __name__ == "__main__":  # pragma: no cover
    start()
