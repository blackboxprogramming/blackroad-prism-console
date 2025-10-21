#
"""Monorepo helpers for package discovery and change tracking."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Dict, Iterable, List

from . import ROOT, ARTIFACTS
from . import inc_counter
from tools import storage


DEFAULT_DIRS = ["orchestrator", "bots", "tools"]


def discover_packages(root: Path = ROOT, dirs: Iterable[str] = DEFAULT_DIRS) -> Dict[str, Path]:
    pkgs: Dict[str, Path] = {}
    for base in dirs:
        base_path = root / base
        if not base_path.exists():
            continue
        for init in base_path.rglob("__init__.py"):
            pkg_path = init.parent
            name = pkg_path.relative_to(root).as_posix().replace("/", ".")
            pkgs[name] = pkg_path
    return pkgs


def graph_packages(pkgs: Dict[str, Path]) -> dict:
    graph = {"nodes": [], "edges": []}
    for name in sorted(pkgs):
        graph["nodes"].append({"name": name})
    return graph


def changed_packages(since: str, root: Path = ROOT) -> List[str]:
    cmd = ["git", "diff", "--name-only", since]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=False, cwd=root)
        files = [f for f in res.stdout.strip().splitlines() if f]
    except Exception:
        files = []
    pkgs = discover_packages(root)
    changed = set()
    for f in files:
        f_path = (root / f).resolve()
        for name, path in pkgs.items():
            try:
                f_path.relative_to(path)
                changed.add(name)
                break
            except ValueError:
                continue
    return sorted(changed)


def write_graph(pkgs: Dict[str, Path]) -> None:
    graph = graph_packages(pkgs)
    out = ARTIFACTS / "pkgs_graph.json"
    storage.write(str(out), graph)
    inc_counter("dx_monorepo_graph")

