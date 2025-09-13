from legal import compliance_calendar


def test_calendar_build_and_list(tmp_path, monkeypatch):
    monkeypatch.setattr(compliance_calendar, "ART_DIR", tmp_path)
    compliance_calendar.CAL_PATH = tmp_path / "calendar.jsonl"
    items = compliance_calendar.build()
    assert items
    listed = compliance_calendar.list_items("2025-09-01", "2025-12-31")
    assert listed
