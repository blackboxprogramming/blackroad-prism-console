from __future__ import annotations

from datetime import date

from agents.codex._30_registrar.pipelines import assemble_filing, calendar_emit


def test_calendar_emit_produces_valarm_and_packet_links():
    entities = assemble_filing.load_entities()
    licenses = assemble_filing.load_licenses()
    packets = assemble_filing.build_packets_for_entities(entities, licenses, master_key="unit-test-key")
    events = calendar_emit.generate_events(entities, licenses, packets)

    assert len(events) == len(licenses)
    for event in events:
        assert any(attachment.startswith("packet://") for attachment in event["attachments"])
        assert all(reminder.startswith("-") for reminder in event["reminders"])

    ics = calendar_emit.emit_ics(events)
    assert "BEGIN:VEVENT" in ics
    assert "BEGIN:VALARM" in ics
    assert "PRODID:-//BlackRoad//Codex-30 Registrar//EN" in ics


def test_due_events_filters_to_window():
    entities = assemble_filing.load_entities()
    licenses = assemble_filing.load_licenses()
    packets = assemble_filing.build_packets_for_entities(entities, licenses, master_key="unit-test-key")
    events = calendar_emit.generate_events(entities, licenses, packets)

    horizon_start = date(2025, 3, 1)
    upcoming = calendar_emit.due_events(events, reference=horizon_start, horizon_days=40)
    assert all(date.fromisoformat(evt["due"]) >= horizon_start for evt in upcoming)
