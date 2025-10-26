"""Reflex hook triggered when a pull request is merged."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start

from ..pipelines.collect_artifacts import collect
from ..pipelines.hash_lineage import lineage
from ..pipelines.validate_policies import check
from ..pipelines.mint_receipt import mint


@BUS.on("git:pr_merged")
def bundle(event: dict) -> None:
    """Create an evidence bundle and mint an attestation receipt."""

    evidence = collect(event)
    evidence["hashes"] = lineage(evidence)
    ok, violations = check(evidence)
    receipt = mint(evidence, ok=ok, violations=violations)
    BUS.emit(
        "audit:evidence.created",
        {"receipt": receipt, "ok": ok, "violations": violations, "bundle": evidence},
    )


if __name__ == "__main__":
    start()
