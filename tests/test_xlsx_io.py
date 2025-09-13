from __future__ import annotations

from console_io.csv_io import Task, export_tasks_csv, import_tasks_csv
from console_io.xlsx_io import export_tasks_xlsx, import_tasks_xlsx


def test_round_trip_parity(tmp_path):
    tasks = [Task(id="1", title="A", owner="alice"), Task(id="2", title="B", owner="bob")]

    csv_path = tmp_path / "tasks.csv"
    export_tasks_csv(csv_path, tasks)
    tasks_from_csv = import_tasks_csv(csv_path)

    xlsx_path = tmp_path / "tasks.xlsx"
    export_tasks_xlsx(xlsx_path, tasks_from_csv)
    tasks_from_xlsx = import_tasks_xlsx(xlsx_path)

    assert tasks_from_csv == tasks_from_xlsx == tasks
