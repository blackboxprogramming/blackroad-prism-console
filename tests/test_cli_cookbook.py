"""Tests for the cookbook CLI helpers."""

from types import SimpleNamespace

import cli.console as console


def test_cmd_cookbook_rejects_binary(tmp_path, capsys, monkeypatch):
    """Binary cookbook inputs are rejected with a helpful message."""

    cookbook_dir = tmp_path / "cookbook" / "tasks"
    cookbook_dir.mkdir(parents=True)
    (cookbook_dir / "binary.md").write_bytes(b"\x00\x01\x02")
    artifact_dir = tmp_path / "artifacts"

    monkeypatch.setattr(console, "COOKBOOK_DIR", cookbook_dir)
    monkeypatch.setattr(console, "ARTIFACT_DIR", artifact_dir)

    console.cmd_cookbook(SimpleNamespace(name="binary"))

    captured = capsys.readouterr()
    assert "Binary files are not supported" in captured.out
    assert not artifact_dir.exists()
