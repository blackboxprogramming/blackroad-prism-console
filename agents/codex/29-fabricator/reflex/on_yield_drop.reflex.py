"""Reflex hook when rolling yield breaches targets."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore


@BUS.on("fab:yield.update")
def watch(evt: dict) -> None:
    rolling_yield = float(evt.get("rolling_yield", 1.0))
    if rolling_yield < 0.97:
        BUS.emit("strat:call.HOLD", {"reason": "yield_drop", "value": rolling_yield})
        BUS.emit("playbook:run", {"id": "pb-halo-safe-release"})


if __name__ == "__main__":
    start()
