"""Reflex bridging runtime events with the Sentinel policy engine."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start

from ..runtime.policy_engine import evaluate
from ..runtime.quarantine import isolate


@BUS.on("runtime:event")
def guard(event: dict) -> None:
    decision = evaluate(event)
    topic = "sentinel:allow" if decision.allow else "sentinel:block"
    BUS.emit(topic, {"event": event, "decision": decision.__dict__})
    if not decision.allow:
        record = isolate(event)
        BUS.emit("audit:evidence.created", {"receipt": record.to_json()})


if __name__ == "__main__":  # pragma: no cover - reflex script entrypoint
    start()
