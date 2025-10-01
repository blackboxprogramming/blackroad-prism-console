import pytest

from agents.auto_novel_agent import AutoNovelAgent


@pytest.fixture()
def agent() -> AutoNovelAgent:
    """Return a fresh ``AutoNovelAgent`` instance for each test."""

    return AutoNovelAgent()


def test_deploy_prints_message(agent: AutoNovelAgent, capfd: pytest.CaptureFixture[str]) -> None:
    agent.deploy()
    captured = capfd.readouterr()
    assert "deployed and ready" in captured.out


@pytest.mark.parametrize(
    "engine_name",
    ["unity", "UNITY", "unreal", "UNREAL"],
)
def test_create_game_with_supported_engine_is_case_insensitive(
    agent: AutoNovelAgent, engine_name: str, capfd: pytest.CaptureFixture[str]
) -> None:
    agent.create_game(engine_name)
    captured = capfd.readouterr()
    expected_fragment = f"Creating a {engine_name.lower().capitalize()} game without weapons"
    assert expected_fragment in captured.out


def test_create_game_with_unsupported_engine(agent: AutoNovelAgent) -> None:
    with pytest.raises(ValueError) as exc:
        agent.create_game("godot")
    assert "Unsupported engine" in str(exc.value)


def test_create_game_with_weapons_disallowed(agent: AutoNovelAgent) -> None:
    with pytest.raises(ValueError) as exc:
        agent.create_game("unity", include_weapons=True)
    assert "Weapons are not allowed" in str(exc.value)


def test_list_supported_engines_sorted(agent: AutoNovelAgent) -> None:
    assert agent.list_supported_engines() == ["unity", "unreal"]


def test_list_supported_engines_returns_fresh_copy(agent: AutoNovelAgent) -> None:
    engines = agent.list_supported_engines()
    engines.append("godot")

    # The agent should not expose internal state that can be mutated from callers.
    assert "godot" not in agent.list_supported_engines()
