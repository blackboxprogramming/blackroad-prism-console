from policy.exceptions.slack import approval_card, prepend_duplicate_notice


def test_approval_card_includes_metadata():
    card = approval_card(
        rule_id="MIRROR_CLASS_LIMIT",
        org_id="acme",
        subject_type="repo",
        subject_id="acme/web",
        reason="Urgent hotfix",
        until="2025-02-01T00:00:00Z",
        exc_id="exc123",
        requested_by="alice",
    )
    blocks = card["blocks"]
    assert blocks[0]["text"]["text"] == "Exception request"
    context = blocks[3]
    elements = context["elements"]
    owners_entry = elements[0]["text"]
    assert owners_entry.startswith("*Owners:* ")
    docs_entry = next(e for e in elements if "Docs" in e.get("text", ""))
    assert "mirror_class_limit" in docs_entry["text"]
    id_entry = next(e for e in elements if "*ID:*" in e.get("text", ""))
    assert "exc123" in id_entry["text"]


def test_prepend_duplicate_notice_adds_warning_block():
    card = approval_card(
        rule_id="MIRROR_CLASS_LIMIT",
        org_id="acme",
        subject_type="repo",
        subject_id="acme/web",
        reason="duplicate",
        until=None,
        exc_id="exc123",
        requested_by="alice",
    )
    prepend_duplicate_notice(card)
    first_block = card["blocks"][0]
    assert first_block["text"]["text"].startswith(":warning:")
