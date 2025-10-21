import json
from pathlib import Path

from dx import monorepo


def test_discover_and_graph(tmp_path, monkeypatch):
    pkg_dir = tmp_path / "orchestrator" / "pkg"
    pkg_dir.mkdir(parents=True)
    (pkg_dir / "__init__.py").write_text("#")
    pkgs = monorepo.discover_packages(tmp_path, ["orchestrator"])
    assert "orchestrator.pkg" in pkgs
    monkeypatch.setattr(monorepo, "ARTIFACTS", tmp_path)
    monorepo.write_graph(pkgs)
    assert (tmp_path / "pkgs_graph.json").exists()
