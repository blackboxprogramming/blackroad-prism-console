import re
from typing import Any, Dict, List, Optional, Tuple

from .model import KnowledgeGraph, _inc_metric


def _parse_node(text: str) -> Tuple[str, str, Dict[str, Any]]:
    m = re.match(r"\((\w+):(\w+)(\[(.*)\])?\)", text.strip())
    var, label, _, props_str = m.groups()
    props: Dict[str, Any] = {}
    if props_str:
        for part in props_str.split(","):
            if not part.strip():
                continue
            k, v = part.split("=")
            props[k.strip()] = v.strip().strip('"')
    return var, label, props


def _match_pattern(pattern: str, kg: KnowledgeGraph) -> List[Dict[str, str]]:
    if "-[:" in pattern:
        left, rest = pattern.split("-[:", 1)
        edge_type, right = rest.split("]->")
        a = _parse_node(left)
        b = _parse_node(right)
        results: List[Dict[str, str]] = []
        for nid, data in kg.nodes.items():
            var_a, label_a, props_a = a
            if data["label"] != label_a:
                continue
            if any(data["props"].get(k) != v for k, v in props_a.items()):
                continue
            for dst in kg.edges.get(nid, {}).get(edge_type, []):
                node_b = kg.nodes.get(dst)
                if not node_b:
                    continue
                var_b, label_b, props_b = b
                if node_b["label"] != label_b:
                    continue
                if any(node_b["props"].get(k) != v for k, v in props_b.items()):
                    continue
                results.append({var_a: nid, var_b: dst})
        return results
    else:
        var, label, props = _parse_node(pattern)
        results = []
        for nid, data in kg.nodes.items():
            if data["label"] != label:
                continue
            if any(data["props"].get(k) != v for k, v in props.items()):
                continue
            results.append({var: nid})
        return results


def _eval_cond(cond: str, row: Dict[str, str], kg: KnowledgeGraph) -> bool:
    cond = cond.strip()
    if cond.upper().startswith("NOT EXISTS"):
        m = re.match(r"NOT EXISTS\((\w+)\.(\w+)\)", cond, re.IGNORECASE)
        var, prop = m.groups()
        node = kg.nodes.get(row.get(var, ""), {})
        return prop not in node.get("props", {})
    m = re.match(r"(\w+)\.(\w+)\s*(=|>=|<=|~)\s*(.*)", cond)
    var, prop, op, value = m.groups()
    value = value.strip().strip('"')
    if value.upper() == "NULL":
        value = None
    node = kg.nodes[row[var]]["props"]
    actual = node.get(prop)
    if op == "=":
        return actual == value
    if op == ">=":
        return actual is not None and str(actual) >= value
    if op == "<=":
        return actual is not None and str(actual) <= value
    if op == "~":
        return isinstance(actual, str) and value in actual
    return False


def run(query: str, kg: Optional[KnowledgeGraph] = None) -> List[Dict[str, Any]]:
    kg = kg or KnowledgeGraph()
    _inc_metric("kg_query")
    q = query.strip()
    limit = None
    m = re.search(r"LIMIT\s+(\d+)", q, re.IGNORECASE)
    if m:
        limit = int(m.group(1))
    m = re.search(r"RETURN\s+(.+?)(?:\s+LIMIT|$)", q, re.IGNORECASE | re.DOTALL)
    fields = [f.strip() for f in m.group(1).split(",")]
    m = re.search(r"WHERE\s+(.+?)\s+RETURN", q, re.IGNORECASE | re.DOTALL)
    where = []
    connectors: List[str] = []
    if m:
        parts = re.split(r"\s+(AND|OR)\s+", m.group(1))
        where = parts[0::2]
        connectors = parts[1::2]
    m = re.search(r"MATCH\s+(.+?)(?:\s+WHERE|\s+RETURN)", q, re.IGNORECASE | re.DOTALL)
    pattern = m.group(1).strip()
    rows = _match_pattern(pattern, kg)
    filtered: List[Dict[str, str]] = []
    for row in rows:
        ok = True
        if where:
            result = _eval_cond(where[0], row, kg)
            for conn, cond in zip(connectors, where[1:]):
                if conn.upper() == "AND":
                    result = result and _eval_cond(cond, row, kg)
                else:
                    result = result or _eval_cond(cond, row, kg)
            ok = result
        if ok:
            filtered.append(row)
    out_rows: List[Dict[str, Any]] = []
    for row in filtered[: limit or None]:
        out: Dict[str, Any] = {}
        for field in fields:
            var, prop = field.split(".")
            nid = row[var]
            if prop == "id":
                out[field] = nid
            else:
                out[field] = kg.nodes[nid]["props"].get(prop)
        out_rows.append(out)
    out_rows.sort(key=lambda r: tuple(r.get(fields[0], "")) if fields else ())
    return out_rows
