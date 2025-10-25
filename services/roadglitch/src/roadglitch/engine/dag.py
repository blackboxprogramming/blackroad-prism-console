from __future__ import annotations

from collections import defaultdict, deque
from typing import Dict, Iterable, List, Sequence

from .types import EdgeSpec, WorkflowSpec


class DAGValidationError(ValueError):
    pass


def build_adjacency(edges: Iterable[EdgeSpec]) -> Dict[str, List[str]]:
    graph: Dict[str, List[str]] = defaultdict(list)
    for edge in edges:
        graph[edge.from_].append(edge.to)
    return graph


def topological_sort(spec: WorkflowSpec) -> Sequence[str]:
    nodes = spec.graph.nodes
    indegree: Dict[str, int] = {node_id: 0 for node_id in nodes}
    adjacency = build_adjacency(spec.graph.edges)
    for deps in adjacency.values():
        for node in deps:
            indegree[node] = indegree.get(node, 0) + 1
    queue = deque([node for node, deg in indegree.items() if deg == 0])
    ordered: List[str] = []
    while queue:
        current = queue.popleft()
        ordered.append(current)
        for neighbor in adjacency.get(current, []):
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    if len(ordered) != len(nodes):
        raise DAGValidationError("Workflow graph contains a cycle")
    return ordered


__all__ = ["DAGValidationError", "topological_sort"]

