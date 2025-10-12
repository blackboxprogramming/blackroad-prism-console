import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_list_supported_engines_sorted():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == sorted(agent.SUPPORTED_ENGINES)


def test_create_game_invalid_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")


def test_create_game_with_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)


@pytest.mark.parametrize(
    ("engine", "expected"),
    [
        ("Unreal", "Creating an Unreal game without weapons..."),
        ("Unity", "Creating a Unity game without weapons..."),
    ],
)
def test_create_game_returns_and_prints_message(engine, expected, capsys):
    agent = AutoNovelAgent()
    result = agent.create_game(engine)
    captured = capsys.readouterr().out.strip()

    assert result == expected
    assert captured == expected
