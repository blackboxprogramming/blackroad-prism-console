from lucidia.brain import LucidiaBrain


def test_pipeline_executes_in_order():
    brain = LucidiaBrain()
    brain.register(lambda x: x + 1)
    brain.register(lambda x: x * 2)
    assert brain.think(3) == 8
