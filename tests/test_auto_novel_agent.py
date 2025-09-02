from agents.auto_novel_agent import AutoNovelAgent


def test_add_engine():
    agent = AutoNovelAgent()
    agent.add_engine("godot")
    assert "godot" in agent.list_supported_engines()
