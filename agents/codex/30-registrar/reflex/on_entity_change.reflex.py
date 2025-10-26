"""Entity change reflex."""
from __future__ import annotations

from ..pipelines import assemble_filing, calendar_emit

try:
    from lucidia.reflex.core import BUS, start
except Exception:  # pragma: no cover
    BUS = None

    def start() -> None:  # pragma: no cover
        raise RuntimeError("lucidia reflex bus not available")


@BUS.on("entity:updated") if BUS else (lambda func: func)
def on_entity_updated(event: dict | None = None) -> None:
    packets = assemble_filing.assemble()
    entities = assemble_filing.load_entities()
    licenses = assemble_filing.load_licenses()
    events = calendar_emit.generate_events(entities, licenses, packets)
    ics = calendar_emit.emit_ics(events)
    payload = {"packets": packets, "ics": ics}
    if BUS:
        BUS.emit("registrar:entity.refresh", payload)
    else:
        print("entity change processed")


if __name__ == "__main__":  # pragma: no cover
    if BUS:
        start()
    else:
        on_entity_updated({})
