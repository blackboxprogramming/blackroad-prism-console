import json
from pathlib import Path

from prism_utils import parse_numeric_prefix


def load_fixture():
    fixture_path = Path(__file__).parent / "fixtures" / "numeric_values.json"
    return json.loads(fixture_path.read_text())


def test_parse_numeric_prefix():
    data = load_fixture()
    assert parse_numeric_prefix(data["values"][0]) == 1.23
    assert parse_numeric_prefix(data["values"][1]) == 1.0
