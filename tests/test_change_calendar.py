from pathlib import Path

from change import calendar


def test_change_conflicts():
    # reset calendar
    Path("artifacts/change/calendar.jsonl").unlink(missing_ok=True)
    good = calendar.Change(
        id="chg1",
        service="CoreAPI",
        type="deploy",
        start="2025-10-01T09:00",
        end="2025-10-01T10:00",
        owner="ops",
        risk="low",
        approved=True,
    )
    calendar.add_change(good)
    assert calendar.conflicts("CoreAPI") == []
    bad = calendar.Change(
        id="chg2",
        service="CoreAPI",
        type="deploy",
        start="2025-10-01T11:00",
        end="2025-10-01T12:00",
        owner="ops",
        risk="low",
        approved=True,
    )
    calendar.add_change(bad)
    issues = calendar.conflicts("CoreAPI")
    assert any("outside" in i for i in issues)
