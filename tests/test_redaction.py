from orchestrator import redaction


def test_scrub_redacts_and_idempotent():
    text = "Contact me at john.doe@example.com or 123-456-7890. SSN 123-45-6789, card 4111111111111111."
    first = redaction.scrub(text)
    assert "REDACTED" in first
    second = redaction.scrub(first)
    assert first == second
