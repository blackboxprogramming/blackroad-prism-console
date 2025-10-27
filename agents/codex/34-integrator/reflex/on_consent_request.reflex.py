"""Reflex hook: approve consent scopes and ask Sentinel for secrets."""
from __future__ import annotations

from typing import Dict, Iterable

from .bus import BUS
from ..pipelines.consent_scope import approve_scope


@BUS.on("integrator:consent.request")
def handle_consent(event: Dict[str, object]) -> None:
    requested = event.get("requested_scopes", [])
    if not isinstance(requested, Iterable):
        requested = []
    approval = approve_scope(list(requested))
    BUS.emit(
        "secrets:request",
        {
            "principal": "Integrator",
            "scope": approval["scopes"],
            "ttl": approval["ttl_seconds"],
        },
    )
