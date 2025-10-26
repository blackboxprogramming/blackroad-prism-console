"""Reflex hook for emitting model training attestations."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start

from ..pipelines.mint_receipt import mint


@BUS.on("train:completed")
def attest(event: dict) -> None:
    """Mint an attestation receipt for the completed training job."""

    receipt = mint({
        "artifacts": event.get("artifacts", []),
        "logs": event.get("logs", []),
        "metrics": {"energy_j": event.get("energy_j")},
        "metadata": {
            "model": event.get("model"),
            "dataset_hashes": event.get("dataset_hashes", []),
            "references": event.get("references", []),
            "pii_scrubbed": True,
        },
        "hashes": event.get("hashes", {}),
    }, ok=True)
    BUS.emit("audit:attestation.published", receipt)


if __name__ == "__main__":
    start()
