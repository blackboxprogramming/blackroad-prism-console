from __future__ import annotations
import json
import os
from typing import Any, Dict, List, Optional


class OrgGraph:
    def __init__(self, path: str):
        self.path = path
        self.edges: List[Dict[str, str]] = []
        if os.path.exists(path):
            try:
                self.edges = json.load(open(path))
            except Exception:
                self.edges = []

    def _save(self):
        json.dump(self.edges, open(self.path, "w"), indent=2)

    def add_edge(self, src: str, rel: str, dst: str):
        self.edges.append({"src": src, "rel": rel, "dst": dst})
        self._save()

    def neighbors(self, node: str, rel: str) -> List[str]:
        return [e["dst"] for e in self.edges if e["src"] == node and e["rel"] == rel]


def apply_salesforce(evt, graph: OrgGraph):
    acc = evt.payload.get("account", {}).get("id")
    opp = evt.payload.get("opportunity", {}).get("id")
    if acc and opp:
        graph.add_edge(acc, "OWNS", opp)


def _normalize_branch(ref: Optional[str]) -> Optional[str]:
    if not ref:
        return None
    if ref.startswith("refs/heads/"):
        return ref.split("/", 2)[-1]
    return ref


def apply_github(evt, graph: OrgGraph):
    repo = (evt.payload.get("repository") or {}).get("full_name")
    if not repo:
        return None

    branch = None
    event_id = evt.type.split(".", 1)[-1]
    if event_id == "push":
        branch = _normalize_branch(evt.payload.get("ref") or evt.payload.get("branch"))
        rel = "HAS_BRANCH"
    elif event_id == "branch.deleted":
        branch = _normalize_branch(evt.payload.get("branch") or evt.payload.get("ref"))
        rel = "DELETED_BRANCH"
    else:
        return None

    if branch:
        graph.add_edge(repo, rel, branch)
    return None
