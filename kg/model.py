import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from tools import storage

ROOT = Path(__file__).resolve().parents[1]
KG_ARTIFACTS = ROOT / "artifacts" / "kg"
GRAPH_PATH = KG_ARTIFACTS / "graph.json"
EVENTS_PATH = KG_ARTIFACTS / "events.jsonl"
METRIC_PATH = KG_ARTIFACTS / "metrics.json"


def _inc_metric(name: str) -> None:
    data = json.loads(storage.read(str(METRIC_PATH)) or "{}")
    data[name] = data.get(name, 0) + 1
    storage.write(str(METRIC_PATH), data)


def _log_event(payload: Dict[str, Any]) -> None:
    payload = {"ts": datetime.utcnow().isoformat(), **payload}
    storage.write(str(EVENTS_PATH), payload)


class KnowledgeGraph:
    """Simple in-memory knowledge graph with persistence."""

    def __init__(self) -> None:
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: Dict[str, Dict[str, List[str]]] = {}
        if GRAPH_PATH.exists():
            self.load()

    def add_node(self, node_id: str, label: str, **props: Any) -> None:
        self.nodes[node_id] = {"label": label, "props": props}
        _inc_metric("kg_node_add")
        _log_event({"event": "kg_update", "node": node_id})
        self.save()

    def add_edge(self, src: str, edge_type: str, dst: str) -> None:
        self.edges.setdefault(src, {}).setdefault(edge_type, [])
        if dst not in self.edges[src][edge_type]:
            self.edges[src][edge_type].append(dst)
        _inc_metric("kg_edge_add")
        _log_event({"event": "kg_update", "edge": [src, edge_type, dst]})
        self.save()

    def neighbors(self, node_id: str, type: Optional[str] = None) -> List[str]:
        rels = self.edges.get(node_id, {})
        if type:
            return rels.get(type, [])
        result: List[str] = []
        for lst in rels.values():
            result.extend(lst)
        return result

    def find(self, label: str, props: Dict[str, Any]) -> List[str]:
        out: List[str] = []
        for nid, data in self.nodes.items():
            if data["label"] != label:
                continue
            if all(data["props"].get(k) == v for k, v in props.items()):
                out.append(nid)
        return out

    def save(self) -> None:
        storage.write(str(GRAPH_PATH), {"nodes": self.nodes, "edges": self.edges})

    def load(self) -> None:
        raw = storage.read(str(GRAPH_PATH))
        if raw:
            data = json.loads(raw)
            self.nodes = data.get("nodes", {})
            self.edges = data.get("edges", {})
