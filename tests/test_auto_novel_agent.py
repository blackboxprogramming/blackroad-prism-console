import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "auto_novel_agent",
    Path(__file__).resolve().parents[1] / "agents" / "auto_novel_agent.py",
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
AutoNovelAgent = module.AutoNovelAgent


def test_add_engine():
    agent = AutoNovelAgent()
    agent.add_engine("godot")
    assert "godot" in agent.list_supported_engines()
