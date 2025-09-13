import pytest

from orchestrator.protocols import BotExecutionError
from program.board import ProgramBoard, ProgramItem


def test_crud(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    board = ProgramBoard()
    item = ProgramItem(id="P1", title="Launch", owner="Ops", bot="Bot1")
    board.add(item)
    assert board.get("P1").title == "Launch"
    board.update("P1", status="done")
    assert board.list("done")[0].id == "P1"


def test_topo_and_cycle(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    board = ProgramBoard()
    board.add(ProgramItem(id="A", title="A", owner="o", bot="b"))
    board.add(ProgramItem(id="B", title="B", owner="o", bot="b", depends_on=["A"]))
    assert board.critical_path() == ["A", "B"]
    board.update("A", depends_on=["B"])
    with pytest.raises(BotExecutionError):
        board.critical_path()

