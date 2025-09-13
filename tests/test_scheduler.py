from datetime import datetime

from orchestrator import Task
from orchestrator.metrics import METRICS_PATH
from orchestrator.scheduler import schedule_poll
from orchestrator.tasks import load_tasks, save_tasks


def test_dependency_block(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    t1 = Task(id="T1", goal="A", bot="Merchandising-BOT")
    t2 = Task(
        id="T2",
        goal="B",
        bot="Store-Ops-BOT",
        depends_on=["T1"],
        scheduled_for=datetime.utcnow(),
    )
    save_tasks([t1, t2])
    schedule_poll(datetime.utcnow())
    tasks = load_tasks()
    assert tasks[1].status == "pending"
    assert METRICS_PATH.exists()
    assert any("dependency_block" in line for line in METRICS_PATH.read_text().splitlines())


def test_ready_task_runs(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    t1 = Task(id="T1", goal="A", bot="Merchandising-BOT", status="done")
    t2 = Task(
        id="T2",
        goal="B",
        bot="Store-Ops-BOT",
        depends_on=["T1"],
        scheduled_for=datetime.utcnow(),
    )
    save_tasks([t1, t2])
    schedule_poll(datetime.utcnow())
    tasks = load_tasks()
    assert tasks[1].status == "done"

