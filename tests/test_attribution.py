from marketing import attribution
import csv
from pathlib import Path


def test_linear_attribution():
    attribution.run_attribution("linear")
    out = Path("artifacts/marketing/attribution/linear.csv")
    rows = list(csv.DictReader(out.open()))
    assert any(r["channel"] == "google" and r["credit"] == "0.5" for r in rows)
    assert any(r["channel"] == "newsletter" and r["credit"] == "0.5" for r in rows)
