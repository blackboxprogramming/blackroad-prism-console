import pytest

from enablement import calendar
from enablement.utils import ART


def test_event_capacity_and_conflict():
    events_file = ART / "events.json"
    if events_file.exists():
        events_file.unlink()
    ev = calendar.add_event("SE Bootcamp Day 1", "bootcamp", "2025-10-12", 1)
    calendar.join(ev.id, "U_SE01")
    with pytest.raises(ValueError):
        calendar.join(ev.id, "U_SE02")
    with pytest.raises(ValueError):
        calendar.add_event("Another", "bootcamp", "2025-10-12", 10)
