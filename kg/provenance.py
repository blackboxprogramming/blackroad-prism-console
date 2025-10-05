import json
from typing import Any, Dict

from tools import storage

from .model import KG_ARTIFACTS, ROOT, KnowledgeGraph


def _next_artifact_id() -> str:
    counter_path = KG_ARTIFACTS / "last_artifact_id.txt"
    last = int(storage.read(str(counter_path)) or 0)
    new = last + 1
    storage.write(str(counter_path), str(new))
    return f"A{new:04d}"


def capture_event(event: Dict[str, Any]) -> KnowledgeGraph:
    """Update the KG based on a normalized event."""
    kg = KnowledgeGraph()
    etype = event.get("type")
    if etype == "task":
        kg.add_node(
            event["id"], "Task", **{k: v for k, v in event.items() if k not in {"type", "id"}}
        )
    elif etype == "artifact":
        art_id = event.get("id") or _next_artifact_id()
        props = {k: v for k, v in event.items() if k not in {"type", "id", "task_id", "bot"}}
        kg.add_node(art_id, "Artifact", **props)
        if tid := event.get("task_id"):
            kg.add_edge(art_id, "DERIVED_FROM", tid)
        if bot := event.get("bot"):
            kg.add_node(bot, "Bot", name=bot)
            kg.add_edge(art_id, "PRODUCED_BY", bot)
    elif etype == "decision":
        kg.add_node(
            event["id"],
            "Decision",
            **{k: v for k, v in event.items() if k not in {"type", "id", "artifact_id"}},
        )
        if aid := event.get("artifact_id"):
            kg.add_edge(event["id"], "DERIVED_FROM", aid)
    elif etype == "metric":
        kg.add_node(
            event["id"],
            "Metric",
            **{k: v for k, v in event.items() if k not in {"type", "id", "artifact_id"}},
        )
        if aid := event.get("artifact_id"):
            kg.add_edge(event["id"], "DERIVED_FROM", aid)
    return kg


def rebuild_from_memory(memory_path: str = "orchestrator/memory.jsonl") -> KnowledgeGraph:
    path = ROOT / memory_path
    kg = KnowledgeGraph()
    if not path.exists():
        return kg
    for line in storage.read(str(path)).splitlines():
        record = json.loads(line)
        task = record.get("task", {})
        kg = capture_event({"type": "task", "id": task.get("id"), "goal": task.get("goal")})
        art_id = _next_artifact_id()
        kg = capture_event(
            {
                "type": "artifact",
                "id": art_id,
                "task_id": task.get("id"),
                "bot": record.get("bot"),
                "path": f"artifacts/{task.get('id')}/response.json",
            }
        )
    kg.load()
    return kg
