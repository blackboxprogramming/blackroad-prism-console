"""Reflex hook when a fabrication station reports a failure."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore


@BUS.on("fab:station.fail")
def halt(evt: dict) -> None:
    BUS.emit("strat:call.HOLD", {"reason": "station_fail", "station": evt.get("name")})
    BUS.emit(
        "audit:evidence.created",
        {"receipt": {"event": "station_fail", "id": evt.get("unit_id")}},
    )
    BUS.emit(
        "qa:defect.logged",
        {"unit": evt.get("unit_id"), "symptom": evt.get("symptom")},
    )


if __name__ == "__main__":
    start()
