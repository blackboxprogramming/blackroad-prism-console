import json
import shutil
import pytest
from tools import storage
from rnd import ideas, experiments, merge


def _clean():
    shutil.rmtree(merge.ARTIFACTS, ignore_errors=True)
    merge.ARTIFACTS.mkdir(parents=True, exist_ok=True)
    board = merge.ROOT / "program" / "board.json"
    if board.exists():
        board.unlink()
    shutil.rmtree(experiments.ARTIFACTS, ignore_errors=True)
    experiments.ARTIFACTS.mkdir(parents=True, exist_ok=True)
    shutil.rmtree(experiments.LAKE, ignore_errors=True)
    experiments.LAKE.mkdir(parents=True, exist_ok=True)


def test_merge_and_gate():
    _clean()
    idea = ideas.new("a", "p", "s", "u", [])
    exp = experiments.design(idea.id, "h", "m")
    experiments.run(exp.id)
    experiments.decide(exp.id, "invest", "reason")
    merge.merge(idea.id)
    path = merge.ARTIFACTS / "merge" / f"{idea.id}.json"
    assert path.exists()
    board = json.loads(storage.read(str(merge.ROOT / "program" / "board.json")))
    assert board and board[0]["idea_id"] == idea.id
    idea2 = ideas.new("b", "p", "s", "u", [])
    exp2 = experiments.design(idea2.id, "h", "m")
    with pytest.raises(RuntimeError):
        merge.merge(idea2.id)
