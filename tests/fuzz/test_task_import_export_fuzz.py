from io import StringIO
import csv
from hypothesis import given, settings, strategies as st
import settings as app_settings


def to_csv(tasks):
    buf = StringIO()
    if not tasks:
        return ""
    writer = csv.DictWriter(buf, fieldnames=list(tasks[0].keys()))
    writer.writeheader()
    writer.writerows(tasks)
    return buf.getvalue()


def from_csv(text):
    if not text:
        return []
    buf = StringIO(text)
    reader = csv.DictReader(buf)
    return list(reader)


def to_xlsx(tasks):
    # simple mock: reuse CSV format
    return to_csv(tasks)


def from_xlsx(data):
    return from_csv(data)


@given(st.lists(st.fixed_dictionaries({
    "id": st.integers(min_value=0, max_value=100),
    "name": st.text(max_size=10),
})))
@settings(max_examples=app_settings.RANDOM_SEED % 50 + 10)
def test_roundtrip(tasks):
    csv_data = to_csv(tasks)
    assert from_csv(csv_data) == [
        {"id": str(t["id"]), "name": t["name"]} for t in tasks
    ]
    xlsx_data = to_xlsx(tasks)
    assert from_xlsx(xlsx_data) == [
        {"id": str(t["id"]), "name": t["name"]} for t in tasks
    ]
