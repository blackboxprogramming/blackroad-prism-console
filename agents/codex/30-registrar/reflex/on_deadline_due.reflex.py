"""Reflex hook for compliance deadlines."""
from __future__ import annotations

from datetime import date

from ..pipelines import assemble_filing, calendar_emit

try:
    from lucidia.reflex.core import BUS, start
except Exception:  # pragma: no cover - optional dependency
    BUS = None

    def start() -> None:  # pragma: no cover - optional dependency
        raise RuntimeError("lucidia reflex bus not available")


@BUS.on("cron:daily") if BUS else (lambda func: func)
def emit_deadline_alerts(event: dict | None = None) -> None:
    packets = assemble_filing.assemble()
    entities = assemble_filing.load_entities()
    licenses = assemble_filing.load_licenses()
    events = calendar_emit.generate_events(entities, licenses, packets)
    upcoming = calendar_emit.due_events(events, reference=date.today(), horizon_days=7)
    for evt in upcoming:
        payload = {"id": evt["uid"], "when": evt["due"], "summary": evt["summary"]}
        if BUS:
            BUS.emit("registrar:deadline.alert", payload)
        else:
            print(f"[registrar] deadline alert: {payload}")


if __name__ == "__main__":  # pragma: no cover
    if BUS:
        start()
    else:
        emit_deadline_alerts({})
