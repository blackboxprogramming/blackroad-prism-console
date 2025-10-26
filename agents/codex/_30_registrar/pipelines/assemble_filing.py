"""Utilities for assembling compliance filing packets."""

from __future__ import annotations

import datetime as dt
import hashlib
import json
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple

import yaml

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def _load_yaml(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def load_entities(data_dir: Optional[Path] = None) -> dict:
    """Load entity metadata from the shared YAML file."""

    target = (data_dir or DATA_DIR) / "entities.yaml"
    payload = _load_yaml(target)
    return payload.get("entities", {})


def load_licenses(data_dir: Optional[Path] = None) -> dict:
    """Load license metadata from the shared YAML file."""

    target = (data_dir or DATA_DIR) / "licenses.yaml"
    payload = _load_yaml(target)
    return payload.get("licenses", {})


def assemble_packet(
    entity_id: str,
    license_ids: Optional[Sequence[str]] = None,
    *,
    prepared_by: str = "Codex-30 Registrar",
    data_dir: Optional[Path] = None,
    timestamp: Optional[dt.datetime] = None,
    notes: Optional[str] = None,
) -> dict:
    """Build a filing packet for an entity and optional licenses.

    Parameters
    ----------
    entity_id:
        Identifier of the entity in ``data/entities.yaml``.
    license_ids:
        Optional collection of license identifiers to include in the packet.
    prepared_by:
        Name or initials recorded on the receipt.
    data_dir:
        Override directory for fixtures during testing.
    timestamp:
        When the packet was prepared. Defaults to ``datetime.now`` with UTC tz.
    notes:
        Optional remarks that are embedded in the receipt.
    """

    entities = load_entities(data_dir)
    if entity_id not in entities:
        raise KeyError(f"Unknown entity '{entity_id}'")

    licenses = load_licenses(data_dir)
    selected_licenses = list(license_ids or entities.get(entity_id, {}).get("licenses", []))

    documents: List[str] = []
    checklist: List[dict] = []

    entity = entities[entity_id]
    jurisdiction = entity.get("jurisdiction", "")
    documents.extend(entity.get("documents", []))

    for item in entity.get("checklist", []):
        checklist.append({"item": item, "status": "pending"})

    for license_id in selected_licenses:
        if license_id not in licenses:
            raise KeyError(f"Unknown license '{license_id}'")
        license_record = licenses[license_id]
        if license_record.get("entity_id") != entity_id:
            raise ValueError(
                f"License '{license_id}' does not belong to entity '{entity_id}'"
            )
        documents.extend(license_record.get("documents", []))
        checklist.append(
            {
                "item": f"Confirm {license_id} renewal requirements",
                "status": "pending",
            }
        )

    documents = sorted(dict.fromkeys(documents))

    receipt_timestamp = timestamp or dt.datetime.now(dt.timezone.utc)
    digest = _build_digest(documents, checklist)

    receipt = {
        "digest": digest,
        "issued_at": receipt_timestamp.isoformat(),
        "prepared_by": prepared_by,
    }
    if notes:
        receipt["notes"] = notes

    packet = {
        "entity_id": entity_id,
        "jurisdiction": jurisdiction,
        "documents": documents,
        "checklist": checklist,
        "receipt": receipt,
    }

    return packet


def _build_digest(documents: Sequence[str], checklist: Sequence[dict]) -> str:
    """Create a stable SHA-256 digest summarising documents and checklist."""

    payload = {
        "documents": list(documents),
        "checklist": [sorted(item.items()) for item in checklist],
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def packet_summary(packet: dict) -> Tuple[str, Iterable[str]]:
    """Return a human-readable summary of the packet."""

    headline = f"{packet['entity_id']} filing for {packet['jurisdiction']}"
    checklist_items = (item["item"] for item in packet.get("checklist", []))
    return headline, checklist_items
