from services import catalog
from healthchecks.synthetic import run_checks
from status import generator
from tools import storage


def test_status_build():
    catalog.load_services("configs/services/*.yaml")
    run_checks("CoreAPI")
    generator.build()
    md = storage.read("artifacts/status/index.md")
    html = storage.read("artifacts/status/index.html")
    assert "CoreAPI" in md
    assert "<html" in html
