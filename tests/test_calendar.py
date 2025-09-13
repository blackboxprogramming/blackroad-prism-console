from marketing import calendar


def test_calendar_add_view():
    calendar.add_item("Q4 Launch Blog", "blog", "2025-10-15", "U_MKT1")
    out = calendar.view_month("2025-10")
    assert "Q4 Launch Blog" in out
