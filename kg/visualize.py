import shutil
from typing import Optional

from tools import storage

from .model import KG_ARTIFACTS, KnowledgeGraph


def export(kg: Optional[KnowledgeGraph] = None) -> None:
    kg = kg or KnowledgeGraph()
    dot_lines = ["digraph G {"]
    for src, edges in kg.edges.items():
        for etype, targets in edges.items():
            for dst in targets:
                dot_lines.append(f'  "{src}" -> "{dst}" [label="{etype}"];')
    dot_lines.append("}")
    if shutil.which("dot"):
        storage.write(str(KG_ARTIFACTS / "kg_export.dot"), "\n".join(dot_lines))
    lines = []
    for nid, data in kg.nodes.items():
        lines.append(f"### {nid} ({data['label']})")
        for etype, targets in kg.edges.get(nid, {}).items():
            for dst in targets:
                lines.append(f"- {etype} -> {dst}")
        lines.append("")
    storage.write(str(KG_ARTIFACTS / "kg_export.md"), "\n".join(lines))
