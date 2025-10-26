import yaml, os, copy
from typing import Dict, Any, Tuple

def _load_yaml(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def _dump_yaml(path: str, data: Dict[str, Any]):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False)

def _find_genes(genome: Dict[str, Any], gene_type: str):
    return [g for g in genome.get("genes", []) if g.get("type") == gene_type]

def _union_tools(g1: Dict[str, Any], g2: Dict[str, Any]):
    tools = set()
    rate_limits = {"tokens_per_min": 0, "tool_calls_per_min": 0}
    for g in (_find_genes(g1, "tool_rights") + _find_genes(g2, "tool_rights")):
        for t in g.get("tools", []):
            tools.add(t)
        rl = g.get("rate_limits", {})
        rate_limits["tokens_per_min"] = max(rate_limits["tokens_per_min"], rl.get("tokens_per_min", 0))
        rate_limits["tool_calls_per_min"] = max(rate_limits["tool_calls_per_min"], rl.get("tool_calls_per_min", 0))
    return {"type": "tool_rights", "tools": sorted(tools), "rate_limits": rate_limits}

def _merge_values(g1: Dict[str, Any], g2: Dict[str, Any]):
    v1 = _find_genes(g1, "values")
    v2 = _find_genes(g2, "values")
    policy = None
    tags1 = set()
    tags2 = set()
    if v1:
        policy = v1[0].get("policy", policy)
    if v2 and policy is None:
        policy = v2[0].get("policy", policy)
    if v1:
        tags1 = set(v1[0].get("tags", []))
    if v2:
        tags2 = set(v2[0].get("tags", []))
    # Intersection to ensure shared values; always preserve 'love-first' if present in either
    intersect = (tags1 & tags2) if (tags1 and tags2) else (tags1 or tags2)
    if "love-first" in tags1 or "love-first" in tags2:
        intersect = set(intersect) | {"love-first"}
    return {"type": "values", "policy": policy, "tags": sorted(intersect)}

def _merge_memory(g1: Dict[str, Any], g2: Dict[str, Any], child_name: str):
    # Create a fresh memory namespace for the child
    return {"type": "memory", "store": f"qdrant://localhost:6333/agents/{child_name}"}

def _merge_skill_loras(g1: Dict[str, Any], g2: Dict[str, Any]):
    loras = []
    seen = set()
    for g in (_find_genes(g1, "skill_lora") + _find_genes(g2, "skill_lora")):
        key = (g.get("name"), g.get("path"))
        if key not in seen:
            seen.add(key)
            loras.append(g)
    return loras

def _combine_caps(g1: Dict[str, Any], g2: Dict[str, Any]):
    # Strictest of both parents
    c1 = g1.get("lifecycle", {}).get("caps", {})
    c2 = g2.get("lifecycle", {}).get("caps", {})
    return {
        "external_write": bool(c1.get("external_write", False) and c2.get("external_write", False)),
        "network_access": bool(c1.get("network_access", False) and c2.get("network_access", False)),
    }

def crossover(parent1_path: str, parent2_path: str, child_path: str, child_species: str):
    p1 = _load_yaml(parent1_path)
    p2 = _load_yaml(parent2_path)

    child = {
        "species": child_species,
        "version": 0.1,
        "base_model": p1.get("base_model", p2.get("base_model")),
        "genes": [],
        "hormones": {
            "curiosity": round((p1.get("hormones", {}).get("curiosity", 0.5) + p2.get("hormones", {}).get("curiosity", 0.5))/2, 2),
            "caution":   round((p1.get("hormones", {}).get("caution", 0.5)   + p2.get("hormones", {}).get("caution", 0.5))/2, 2),
        },
        "lifecycle": {"phase": "infant", "caps": _combine_caps(p1, p2)},
    }

    tool_gene = _union_tools(p1, p2)
    values_gene = _merge_values(p1, p2)
    memory_gene = _merge_memory(p1, p2, child_species.split("/")[-1])
    lora_genes = _merge_skill_loras(p1, p2)

    child["genes"].extend(lora_genes)
    child["genes"].append(tool_gene)
    child["genes"].append(values_gene)
    child["genes"].append(memory_gene)

    _dump_yaml(child_path, child)
    return child
