"""Reflex issuing Sentinel scoped secrets."""

from __future__ import annotations

from lucidia.reflex.core import BUS, start

from ..runtime.policy_engine import evaluate
from ..secrets.envelope import issue_token


@BUS.on("secrets:request")
def issue(event: dict) -> None:
    scope = event.get("scope", "read-only")
    ttl = int(event.get("ttl", 900))
    decision = evaluate({"type": "secret", "scope": scope, "ttl": ttl})
    if not decision.allow:
        BUS.emit("secrets:denied", {"event": event, "decision": decision.__dict__})
        return
    grant = issue_token(event["principal"], scope=scope, ttl=ttl)
    BUS.emit(
        "secrets:issued",
        {
            "principal": event["principal"],
            "scope": grant.scope,
            "ttl": grant.ttl,
            "token": grant.token,
        },
    )


if __name__ == "__main__":  # pragma: no cover - reflex script entrypoint
    start()
