from __future__ import annotations

from agents.codex._30_registrar.pipelines.contacts_encrypt import DEFAULT_SENSITIVE_FIELDS, redact_contacts, seal_contacts


def test_seal_contacts_encrypts_sensitive_fields():
    payload = {
        "legal_name": "Example LLC",
        "officer": {
            "name": "Jamie Example",
            "email": "jamie@example.com",
            "phone": "+1-555-0110",
            "home_address": "123 Example St",
        },
    }

    sealed, redactions = seal_contacts(payload, master_key="unit-test-key")

    assert sealed["officer"]["email"] != payload["officer"]["email"]
    assert isinstance(sealed["officer"]["email"], str)
    assert len(sealed["officer"]["email"]) > 10
    assert any(item.path == "officer.email" for item in redactions)

    sanitized = redact_contacts(payload, redactions)
    assert sanitized["officer"]["email"] == "[REDACTED]"
    assert sanitized["officer"]["name"] == payload["officer"]["name"]

    for field in DEFAULT_SENSITIVE_FIELDS:
        if field in payload["officer"]:
            assert sealed["officer"][field] != payload["officer"][field]
