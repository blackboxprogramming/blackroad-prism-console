"""Reflex hook that calls the HALO play during incidents."""
from __future__ import annotations

from lucidia.reflex.core import BUS, start  # type: ignore

from ..pipelines.call_play import run_playbook


@BUS.on("incident:raised")
def incident(event: dict) -> None:
    """Run the HALO playbook and broadcast the formation."""
    trace = run_playbook("pb-halo-safe-release", context=event)
    BUS.emit("strat:formation", {"name": "HALO", "incident": event.get("id"), "trace": trace.as_dict()})


if __name__ == "__main__":  # pragma: no cover
    start()
