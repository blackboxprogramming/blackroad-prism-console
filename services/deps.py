from __future__ import annotations

from typing import Dict, List, Set

from tools import metrics

from .catalog import Service


def validate_dependencies(services: List[Service]) -> List[str]:
    ids = {s.id for s in services}
    errors: List[str] = []
    graph: Dict[str, List[str]] = {s.id: s.dependencies for s in services}
    # missing references
    for s in services:
        for dep in s.dependencies:
            if dep not in ids:
                errors.append(f"{s.id} missing {dep}")
    # cycle detection
    visited: Set[str] = set()
    stack: Set[str] = set()

    def dfs(node: str):
        if node in stack:
            errors.append(f"cycle at {node}")
            metrics.emit("svc_dep_cycle", 1)
            return
        if node in visited:
            return
        visited.add(node)
        stack.add(node)
        for nei in graph.get(node, []):
            dfs(nei)
        stack.remove(node)

    for node in ids:
        dfs(node)
    return errors


def blast_radius(service_id: str, services: List[Service]) -> List[str]:
    rev: Dict[str, List[str]] = {s.id: [] for s in services}
    for s in services:
        for d in s.dependencies:
            rev.setdefault(d, []).append(s.id)
    result: List[str] = []
    queue = rev.get(service_id, [])[:]
    seen: Set[str] = set()
    while queue:
        cur = queue.pop(0)
        if cur in seen:
            continue
        seen.add(cur)
        result.append(cur)
        queue.extend(rev.get(cur, []))
    metrics.emit("svc_blastradius", len(result))
    return result
