"""Assemble filing packets for Codex-30 Registrar."""
from __future__ import annotations

import hashlib
import json
import os
from dataclasses import asdict
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence, Tuple

import yaml
from jsonschema import Draft7Validator

from .contacts_encrypt import Redaction, redact_contacts, seal_contacts

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "filing_packet.schema.json"
RULES_PATH = ROOT / "rules" / "compliance_rules.yaml"
ENTITIES_PATH = ROOT / "data" / "entities.yaml"
LICENSES_PATH = ROOT / "data" / "licenses.yaml"


with SCHEMA_PATH.open("r", encoding="utf-8") as handle:
    FILING_SCHEMA = json.load(handle)
VALIDATOR = Draft7Validator(FILING_SCHEMA)


def _load_yaml(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def load_entities(path: Path = ENTITIES_PATH) -> List[Dict[str, Any]]:
    """Load entity records from a YAML file."""

    data = _load_yaml(path) or {}
    return list(data.get("entities", []))


def load_licenses(path: Path = LICENSES_PATH) -> List[Dict[str, Any]]:
    """Load license records from a YAML file."""

    data = _load_yaml(path) or {}
    return list(data.get("licenses", []))


def load_rules(path: Path = RULES_PATH) -> Dict[str, Any]:
    """Load compliance rules."""

    return _load_yaml(path) or {}


def _fingerprint(payload: Dict[str, Any]) -> str:
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _resolve_attachments(licenses: Sequence[Dict[str, Any]], rules: Dict[str, Any]) -> List[str]:
    attachments: List[str] = []
    ruleset = rules.get("jurisdictions", {})
    for record in licenses:
        jurisdiction = record.get("jurisdiction")
        for config in ruleset.get(jurisdiction, {}).values():
            for template in config.get("attachments", []):
                if template not in attachments:
                    attachments.append(template)
    return attachments


def _build_documents(entity: Dict[str, Any], attachments: Sequence[str]) -> List[Dict[str, Any]]:
    documents: List[Dict[str, Any]] = []
    for template in attachments:
        documents.append(
            {
                "name": f"{entity['legal_name']} :: {template}",
                "template": template,
                "status": "draft",
            }
        )
    if not documents:
        documents.append(
            {
                "name": f"{entity['legal_name']} compliance summary",
                "template": "board-minutes.md.gotmpl",
                "status": "draft",
            }
        )
    return documents


def _build_checklist(licenses: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    checklist: List[Dict[str, Any]] = []
    for record in licenses:
        for requirement in record.get("requirements", []):
            due = record.get("renewal_due")
            if hasattr(due, 'isoformat'):
                due = due.isoformat()
            checklist.append(
                {
                    "item": requirement,
                    "status": "pending",
                    "owner": record.get("entity_id"),
                    "due": due,
                }
            )
    return checklist


def _build_payments(licenses: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    payments: List[Dict[str, Any]] = []
    for record in licenses:
        fee = record.get("fee")
        currency = record.get("currency") or "USD"
        if fee is None:
            continue
        due = record.get("renewal_due")
        if hasattr(due, 'isoformat'):
            due = due.isoformat()
        payments.append(
            {
                "amount": float(fee),
                "currency": currency,
                "status": "queued",
                "reference": record["id"],
                "due": due,
            }
        )
    return payments


def _due_and_cycle(licenses: Sequence[Dict[str, Any]]) -> Tuple[str, str]:
    due_dates: List[str] = []
    cycles: List[str] = []
    for record in licenses:
        due = record.get("renewal_due")
        if due:
            if hasattr(due, 'isoformat'):
                due = due.isoformat()
            due_dates.append(due)
        cycle = record.get("renewal_cycle")
        if cycle:
            cycles.append(cycle)
    due_date = min(due_dates) if due_dates else date.today().isoformat()
    if hasattr(due_date, 'isoformat'):
        due_date = due_date.isoformat()
    cycle = cycles[0] if cycles else "annual"
    return due_date, cycle


def build_packet(
    entity: Dict[str, Any],
    licenses: Sequence[Dict[str, Any]],
    *,
    master_key: str,
    rules: Dict[str, Any] | None = None,
    packet_id: str | None = None,
    issued_at: datetime | None = None,
) -> Dict[str, Any]:
    """Build a schema-compliant filing packet for an entity."""

    rules = rules or load_rules()
    issued_at = issued_at or datetime.utcnow()

    attachments = _resolve_attachments(licenses, rules)
    documents = _build_documents(entity, attachments)
    checklist = _build_checklist(licenses)
    payments = _build_payments(licenses)
    due_date, cycle = _due_and_cycle(licenses)

    sealed_entity, redactions = seal_contacts(entity, master_key)
    sanitized_contacts = redact_contacts(entity, redactions)

    packet_identifier = packet_id or f"fp-{entity['id']}"

    packet: Dict[str, Any] = {
        "id": packet_identifier,
        "entity_id": entity["id"],
        "jurisdiction": entity.get("jurisdiction", ""),
        "cycle": cycle,
        "due_date": due_date,
        "documents": documents,
        "checklist": checklist,
        "payments": payments,
        "receipts": [],
        "redactions": [asdict(redaction) for redaction in redactions],
        "attestation": {
            "officer": entity.get("officer", {}).get("name", "Registrar"),
            "signed_at": issued_at.isoformat() + "Z",
        },
    }

    packet_receipt = {
        "topic": "filing_packet",
        "reference": packet_identifier,
        "hash": _fingerprint(packet),
        "issued_at": issued_at.isoformat() + "Z",
    }
    redaction_receipt = {
        "topic": "redaction_diff",
        "reference": packet_identifier,
        "hash": _fingerprint({"redactions": packet["redactions"]}),
        "issued_at": issued_at.isoformat() + "Z",
    }
    contacts_receipt = {
        "topic": "contacts_encrypted",
        "reference": entity["id"],
        "hash": _fingerprint(sealed_entity),
        "issued_at": issued_at.isoformat() + "Z",
    }
    packet["receipts"].extend([packet_receipt, redaction_receipt, contacts_receipt])

    VALIDATOR.validate(packet)
    packet["_sealed_contacts"] = sealed_entity  # typed for downstream but excluded from schema
    packet["_sanitized_contacts"] = sanitized_contacts

    return packet


def build_packets_for_entities(
    entities: Iterable[Dict[str, Any]],
    licenses: Sequence[Dict[str, Any]],
    *,
    master_key: str,
    rules: Dict[str, Any] | None = None,
) -> List[Dict[str, Any]]:
    """Build packets for all supplied entities."""

    rules = rules or load_rules()
    packets: List[Dict[str, Any]] = []
    license_index: Dict[str, List[Dict[str, Any]]] = {}
    for record in licenses:
        license_index.setdefault(record["entity_id"], []).append(record)
    for entity in entities:
        entity_licenses = license_index.get(entity["id"], [])
        packet = build_packet(entity, entity_licenses, master_key=master_key, rules=rules)
        packets.append(packet)
    return packets


def assemble(default_key: str | None = None) -> List[Dict[str, Any]]:
    """High-level helper that loads data files and builds packets."""

    master_key = default_key or os.getenv("REGISTRAR_FIELD_KEY", "codex-30-registry")
    entities = load_entities()
    licenses = load_licenses()
    rules = load_rules()
    return build_packets_for_entities(entities, licenses, master_key=master_key, rules=rules)


__all__ = [
    "assemble",
    "build_packet",
    "build_packets_for_entities",
    "load_entities",
    "load_licenses",
    "load_rules",
]
