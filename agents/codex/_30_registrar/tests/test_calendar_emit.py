from datetime import date
from pathlib import Path

from agents.codex._30_registrar.pipelines.calendar_emit import (
    CalendarConfig,
    due_events,
    generate_calendar,
    load_rules,
)

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def test_generate_calendar_includes_reminders_and_links():
    ics = generate_calendar(2024, data_dir=DATA_DIR)

    assert "BEGIN:VEVENT" in ics
    assert "SUMMARY:Delaware Annual Report (DE)" in ics
    assert "URL:https://files.blackroad/receipts/br-holdings-annual-report.pdf" in ics

    # All reminders from codex30.yaml should appear as VALARM blocks
    reminders = CalendarConfig.load().reminders
    assert reminders
    assert ics.count("BEGIN:VALARM") == len(reminders) * len(load_rules())


def test_due_events_rolls_forward_when_date_passed():
    today = date(2024, 4, 1)
    events = due_events(today=today, window_days=60, data_dir=DATA_DIR)
    # Delaware event should roll to March 1 2025 and still be included
    summaries = {event["summary"] for event in events}
    assert "Delaware Annual Report (DE)" in summaries
