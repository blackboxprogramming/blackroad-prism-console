"""Reflex hooking build completion to SBOM attestations."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start

from ..sbom.build_sbom import build
from ..sbom.sign_artifact import sign
from ..sbom.verify_artifact import verify


@BUS.on("build:complete")
def attest(event: dict) -> None:
    artifact = event["artifact"]
    sbom = build(artifact)
    signature = sign(artifact, sbom.to_dict())
    ok = verify(artifact, signature, sbom.to_dict())
    BUS.emit("sentinel:attested", {"ok": ok, "artifact": artifact, "sbom": sbom.to_dict()})
    if not ok:
        BUS.emit("publish:blocked", {"reason": "sbom/signature", "artifact": artifact})


if __name__ == "__main__":  # pragma: no cover - reflex script entrypoint
    start()
