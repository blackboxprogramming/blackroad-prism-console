import json
from pathlib import Path


def test_accessibility_doc_listed():
    index = json.loads(Path("docs/index.json").read_text())
    pages = []
    for arr in index.values():
        pages.extend(arr)
    assert any("accessibility" in p for p in pages)
