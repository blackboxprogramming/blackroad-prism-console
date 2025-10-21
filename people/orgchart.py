import csv
from collections import defaultdict
from pathlib import Path
from typing import Dict, List


def build_tree(demo_csv: Path, include_open: List[Dict[str, str]] = None) -> Dict[str, List[str]]:
    people = list(csv.DictReader(demo_csv.open()))
    children = defaultdict(list)
    for p in people:
        children[p.get("manager_id")].append(p["employee_id"])
    if include_open:
        for req in include_open:
            children[req.get("manager")].append(f"REQ-{req['req_id']}")
    return children


def render_tree(children: Dict[str, List[str]], root: str = "CEO", indent: int = 0) -> str:
    lines = []
    prefix = " " * indent
    lines.append(f"{prefix}{root}")
    for ch in children.get(root, []):
        lines.append(render_tree(children, ch, indent + 2))
    return "\n".join(lines)


def write_artifacts(out_dir: Path, tree: str, people: List[Dict[str, str]]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "tree.md").write_text(tree)
    lines = ["employee_id,manager_id,dept,role,level"]
    for p in people:
        lines.append(
            f"{p['employee_id']},{p['manager_id']},{p['dept']},{p['role']},{p['level']}"
        )
    (out_dir / "roles.csv").write_text("\n".join(lines))


def what_if(children: Dict[str, List[str]], freeze: str = None) -> Dict[str, List[str]]:
    """Simple what-if: remove a department root."""
    if freeze and freeze in children:
        children = dict(children)
        children.pop(freeze, None)
    return children
