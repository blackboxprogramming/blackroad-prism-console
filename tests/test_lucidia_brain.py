from lucidia.brain import LucidiaBrain
import pytest


def test_pipeline_executes_in_order():
    brain = LucidiaBrain()
    brain.register(lambda x: x + 1, name="add1")
    brain.register(lambda x: x * 2, name="mul2")
    assert brain.think(3) == 8


def test_register_names_and_unregister():
    brain = LucidiaBrain()

    def inc(x: int) -> int:
        return x + 1

    brain.register(inc)
    brain.register(lambda x: x * 2, name="double")
    assert brain.steps == ["inc", "double"]
    brain.unregister("inc")
    assert brain.steps == ["double"]
    assert brain.think(3) == 6


def test_reset_clears_steps():
    brain = LucidiaBrain()
    brain.register(lambda x: x + 1, name="inc")
    brain.reset()
    assert brain.steps == []


def test_register_duplicate_name_raises():
    brain = LucidiaBrain()
    brain.register(lambda x: x, name="id")
    with pytest.raises(ValueError):
        brain.register(lambda x: x, name="id")
