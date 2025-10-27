"""Reflex hook: energy updates → potential scope shrink."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.energy_per_outcome import spike


@BUS.on("energy:update")
def guard(event: dict) -> None:
    """Emit guardrail signals when energy spikes."""
    if spike(event):
        BUS.emit("strat:call.HOLD", {"reason": "pm_energy_spike", "event": event})
        BUS.emit("pm:scope.shrink", {"hint": "reduce surface by 30%"})


if __name__ == "__main__":  # pragma: no cover
    start()
