"""Reflex hook reacting to KPI drift events."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.risk_scan import classify


@BUS.on("kpi:update")
def on_kpi(event: dict) -> None:
    """Emit HOLD/NO-GO calls based on KPI drift severity."""
    token = classify(event)
    if token == "red":
        BUS.emit("strat:call.NO-GO", {"reason": "kpi_drift", "kpi": event})
    elif token == "amber":
        BUS.emit("strat:call.HOLD", {"reason": "kpi_watch", "kpi": event})


if __name__ == "__main__":  # pragma: no cover
    start()
