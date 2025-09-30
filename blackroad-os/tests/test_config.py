from pathlib import Path

from blackroad_agent.config import load_settings


def test_load_settings(tmp_path: Path) -> None:
    config_path = tmp_path / "config.yaml"
    config_path.write_text(
        """
agent:
  node_name: test-node
  data_dir: {data_dir}
  transports: []
  plugins: []
manifests:
  actions: manifests/actions.yaml
        """.strip().format(data_dir=str(tmp_path / "data"))
    )
    settings = load_settings(config_path)
    assert settings.agent.node_name == "test-node"
    assert settings.agent.data_dir.exists()
