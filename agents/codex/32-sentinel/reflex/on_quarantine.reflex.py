"""Reflex persisting quarantine receipts for the Auditor."""

from __future__ import annotations

from pathlib import Path

from lucidia.reflex.core import BUS, start

from ..runtime.quarantine import QuarantineRecord, persist

_RECEIPT_DIR = Path("/tmp/sentinel/receipts")


@BUS.on("sentinel:quarantine")
def record(event: dict) -> None:
    receipt = event.get("receipt")
    if not receipt:
        return
    record_obj = QuarantineRecord(event=receipt["event"], action=receipt["action"], ts=receipt["ts"])
    file_name = f"quarantine-{int(record_obj.ts)}.json"
    persist(record_obj, _RECEIPT_DIR / file_name)
    BUS.emit("audit:receipt.persisted", {"path": str(_RECEIPT_DIR / file_name)})


if __name__ == "__main__":  # pragma: no cover - reflex script entrypoint
    start()
