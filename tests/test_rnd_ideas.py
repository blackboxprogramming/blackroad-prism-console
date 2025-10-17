import shutil
from rnd import ideas


def _clean():
    shutil.rmtree(ideas.ARTIFACTS, ignore_errors=True)
    shutil.rmtree(ideas.LAKE, ignore_errors=True)
    ideas.ARTIFACTS.mkdir(parents=True, exist_ok=True)
    ideas.LAKE.mkdir(parents=True, exist_ok=True)


def test_scoring_deterministic():
    _clean()
    idea = ideas.new("Adaptive charging", "p", "s", "u", ["battery"])
    s1 = ideas.score(idea)
    s2 = ideas.score(idea)
    assert s1 == s2


def test_list_filter():
    _clean()
    ideas.new("a", "p", "s", "u", [], status="new")
    ideas.new("b", "p", "s", "u", [], status="screening")
    lst = ideas.list("screening")
    assert len(lst) == 1 and lst[0].title == "b"
