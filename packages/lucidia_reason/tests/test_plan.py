from pathlib import Path
from lucidia_reason.pot import plan_question


def test_plan_writes_traces(tmp_path: Path):
    out_dir = tmp_path / "traces"
    traces = plan_question("What?", n=2, out_dir=str(out_dir), seed=1)
    assert len(traces) == 2
    files = sorted(out_dir.glob("trace_*.jsonl"))
    assert len(files) == 2
    content = files[0].read_text().strip().splitlines()
    assert content[0].startswith("{\"op\": \"PLAN\"")
    assert content[-1].startswith("{\"op\": \"YIELD\"")
