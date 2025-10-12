import pytest

from agents.auto_novel_agent import AutoNovelAgent


@pytest.fixture(autouse=True)
def reset_engines():
    original = AutoNovelAgent.SUPPORTED_ENGINES.copy()
    yield
    AutoNovelAgent.SUPPORTED_ENGINES = original


def test_default_supported_engines():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["godot", "unity", "unreal"]


def test_add_engine_and_list():
    agent = AutoNovelAgent()
    agent.add_engine("cryengine")
    assert "cryengine" in agent.list_supported_engines()


def test_add_engine_rejects_blank_name():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.add_engine("   ")


def test_add_engine_normalizes_case():
    agent = AutoNovelAgent()
    agent.add_engine("CRYENGINE")
    assert "cryengine" in agent.list_supported_engines()
    assert all(engine == engine.lower() for engine in AutoNovelAgent.SUPPORTED_ENGINES)


def test_invalid_engine_raises():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("cryengine")


def test_weapons_not_allowed():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)
