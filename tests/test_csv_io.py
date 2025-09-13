import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "csv_io", Path(__file__).resolve().parent.parent / "io" / "csv_io.py"
)
csv_io = importlib.util.module_from_spec(spec)
spec.loader.exec_module(csv_io)
export_tasks = csv_io.export_tasks
import_tasks = csv_io.import_tasks


def test_round_trip(tmp_path):
    csv_in = tmp_path / "tasks.csv"
    csv_in.write_text(
        "id,goal,context_json,depends_on_csv,scheduled_for_iso,bot\n"
        "T1,Goal1,{},,2025-01-01T00:00:00,Merchandising-BOT\n"
    )
    tasks = import_tasks(csv_in)
    assert tasks[0].id == "T1"
    csv_out = tmp_path / "out.csv"
    export_tasks(csv_out, tasks)
    assert "T1" in csv_out.read_text()

