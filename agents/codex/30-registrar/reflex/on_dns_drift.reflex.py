"""DNS drift guard reflex."""
from __future__ import annotations

from ..pipelines.zone_sync import diff_zone, summarize

try:
    from lucidia.reflex.core import BUS, start
except Exception:  # pragma: no cover
    BUS = None

    def start() -> None:  # pragma: no cover
        raise RuntimeError("lucidia reflex bus not available")


@BUS.on("dns:scan") if BUS else (lambda func: func)
def on_dns_scan(event: dict | None) -> None:
    event = event or {}
    drift = diff_zone(event.get("current", {}), event.get("desired", {}))
    if not drift:
        return
    diff_payload = [item.to_dict() for item in drift]
    summary = summarize(drift)
    message = {"reason": "dns_drift", "diff": diff_payload, "summary": summary}
    if BUS:
        BUS.emit("strat:call.HOLD", message)
        BUS.emit("audit:evidence.created", {"receipt": {"topic": "dns_drift", "diff": diff_payload}})
    else:
        print(summary)


if __name__ == "__main__":  # pragma: no cover
    if BUS:
        start()
    else:
        on_dns_scan({})
