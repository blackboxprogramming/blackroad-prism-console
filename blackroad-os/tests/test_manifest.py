from pathlib import Path

from blackroad_agent.manifest import ActionCatalog


def test_manifest_load(tmp_path: Path) -> None:
    manifest = tmp_path / "actions.yaml"
    manifest.write_text(
        """
actions:
  - id: test.action
    summary: Test action
    plugin: test
    inputs: {}
        """.strip()
    )
    catalog = ActionCatalog.from_path(manifest)
    action = catalog.by_id("test.action")
    assert action.plugin == "test"
