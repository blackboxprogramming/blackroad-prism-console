"""Reflex hook enforcing guardpacks before publishing artifacts."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start

from ..pipelines.scrub_pii import scrub
from ..pipelines.validate_policies import check


@BUS.on("publish:attempt")
def gate(event: dict) -> None:
    """Scrub the artifact and gate publication on policy compliance."""

    clean_artifact = scrub(event.get("artifact", {}))
    ok, violations = check(clean_artifact if isinstance(clean_artifact, dict) else {
        "artifacts": [clean_artifact],
        "logs": [],
        "metrics": {},
        "metadata": {"pii_scrubbed": True},
    })
    topic = "publish:allowed" if ok else "publish:blocked"
    BUS.emit(topic, {"artifact": clean_artifact, "violations": violations})


if __name__ == "__main__":
    start()
