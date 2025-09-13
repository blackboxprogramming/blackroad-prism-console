import json
from pathlib import Path

from orchestrator import lineage


def test_lineage_records(tmp_path):
    lineage_path = Path("orchestrator/lineage.jsonl")
    if lineage_path.exists():
        lineage_path.unlink()
    trace = lineage.start_trace("T1")
    lineage.record_usage(trace, "dataset", ["col1"])
    lineage.finalize(trace)
    lines = Path(lineage_path).read_text().strip().splitlines()
    record = json.loads(lines[0])
    assert record["trace_id"] == trace
    assert record["usage"][0]["dataset"] == "dataset"
