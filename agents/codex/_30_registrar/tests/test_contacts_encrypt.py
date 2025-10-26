from agents.codex._30_registrar.pipelines.contacts_encrypt import (
    encrypt_contacts,
    redact_contact,
)


def test_encrypt_contacts_marks_receipts():
    records = [
        {"id": "entity-1", "email": "filings@blackroad.io", "home_address": "123 Main"},
        {"id": "entity-2", "email": "ops@blackroad.io", "account": "000111"},
    ]

    sanitized, receipts = encrypt_contacts(records, "secret")

    assert sanitized[0]["home_address"].startswith("encrypted:")
    assert len(receipts) == 2
    assert receipts[0]["id"] == "entity-1"
    assert "home_address" in receipts[0]["redacted_fields"]

    redacted = redact_contact(sanitized[0])
    assert redacted["home_address"] == "<redacted>"
    assert not redacted["email"].startswith("encrypted:")
