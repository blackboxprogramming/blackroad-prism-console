"""Reflex that regenerates packets after entity updates."""

from __future__ import annotations

from typing import Dict, Sequence

from ..pipelines.assemble_filing import assemble_packet
from ..pipelines.validate_compliance import validate_packet


def refresh_packets(entity_id: str, license_ids: Sequence[str] | None = None) -> Dict[str, object]:
    """Assemble and validate a filing packet when an entity changes."""

    packet = assemble_packet(entity_id, license_ids)
    errors = validate_packet(packet)
    return {"packet": packet, "valid": not errors, "errors": errors}
