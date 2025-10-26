"""Module crossover operator for Lucidia agent genomes."""
from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import yaml

AGENTS_ROOT = Path("prism/agents")


def _load_genome(agent_name: str, agents_root: Path = AGENTS_ROOT) -> Dict:
    genome_path = agents_root / agent_name / "genome.yaml"
    if not genome_path.exists():
        raise FileNotFoundError(f"Genome file not found for agent '{agent_name}' at {genome_path}")
    with genome_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def _unique_genes(genes: Iterable[Dict]) -> List[Dict]:
    seen = set()
    unique: List[Dict] = []
    for gene in genes:
        marker = _freeze(gene)
        if marker not in seen:
            seen.add(marker)
            unique.append(gene)
    return unique


def _merge_tool_rights(genes_a: List[Dict], genes_b: List[Dict]) -> Dict:
    tools = set()
    tokens_limits: List[int] = []
    tool_call_limits: List[int] = []
    for gene in list(genes_a) + list(genes_b):
        if gene.get("type") != "tool_rights":
            continue
        tools.update(gene.get("tools", []))
        limits = gene.get("rate_limits", {})
        if "tokens_per_min" in limits:
            tokens_limits.append(limits["tokens_per_min"])
        if "tool_calls_per_min" in limits:
            tool_call_limits.append(limits["tool_calls_per_min"])
    merged_limits = {}
    if tokens_limits:
        merged_limits["tokens_per_min"] = min(tokens_limits)
    if tool_call_limits:
        merged_limits["tool_calls_per_min"] = min(tool_call_limits)
    merged_gene = {
        "type": "tool_rights",
        "tools": sorted(tools),
    }
    if merged_limits:
        merged_gene["rate_limits"] = merged_limits
    return merged_gene


def _intersect_values(genes_a: List[Dict], genes_b: List[Dict]) -> List[Dict]:
    values_a = [gene for gene in genes_a if gene.get("type") == "values"]
    values_b = [gene for gene in genes_b if gene.get("type") == "values"]
    signatures_b = {_values_signature(gene) for gene in values_b}
    intersection: List[Dict] = []
    for gene in values_a:
        if _values_signature(gene) in signatures_b:
            intersection.append(gene)
    return intersection


def _values_signature(gene: Dict) -> Tuple:
    relevant = {key: gene[key] for key in sorted(gene.keys()) if key != "type"}
    return tuple(sorted(relevant.items()))


def _freeze(value: Any) -> Tuple:
    if isinstance(value, dict):
        return tuple((key, _freeze(val)) for key, val in sorted(value.items()))
    if isinstance(value, list):
        return tuple(_freeze(item) for item in value)
    return value


def _combine_caps(parent_a: Dict, parent_b: Dict) -> Dict:
    caps_a = parent_a.get("lifecycle", {}).get("caps", {})
    caps_b = parent_b.get("lifecycle", {}).get("caps", {})
    combined: Dict[str, bool] = {}
    for key in set(caps_a) | set(caps_b):
        combined[key] = bool(caps_a.get(key, False) and caps_b.get(key, False))
    return combined


def create_child(parent_a: str, parent_b: str, child: str, agents_root: Path = AGENTS_ROOT) -> Path:
    """Create a child genome using module crossover.

    Args:
        parent_a: Name of the first parent agent.
        parent_b: Name of the second parent agent.
        child: Name for the child agent.
        agents_root: Root directory for agent genomes.

    Returns:
        Path to the generated child genome file.
    """

    genome_a = _load_genome(parent_a, agents_root)
    genome_b = _load_genome(parent_b, agents_root)

    child_dir = agents_root / child
    child_dir.mkdir(parents=True, exist_ok=True)

    base_model = genome_a.get("base_model") or genome_b.get("base_model")
    hormones = genome_a.get("hormones", {})

    merged_genes: List[Dict] = []
    merged_genes.extend(gene for gene in genome_a.get("genes", []) if gene.get("type") not in {"tool_rights", "values"})
    merged_genes.extend(gene for gene in genome_b.get("genes", []) if gene.get("type") not in {"tool_rights", "values"})

    merged_tool_gene = _merge_tool_rights(genome_a.get("genes", []), genome_b.get("genes", []))
    merged_values = _intersect_values(genome_a.get("genes", []), genome_b.get("genes", []))

    merged_genes.append(merged_tool_gene)
    merged_genes.extend(merged_values)

    child_genome = {
        "species": child,
        "version": _derive_version(genome_a, genome_b),
        "base_model": base_model,
        "genes": _unique_genes(merged_genes),
        "hormones": hormones,
        "lifecycle": {
            "phase": "infant",
            "caps": _combine_caps(genome_a, genome_b),
        },
        "created_at": datetime.utcnow().isoformat() + "Z",
        "parents": [parent_a, parent_b],
    }

    output_path = child_dir / "genome.yaml"
    with output_path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(child_genome, handle, sort_keys=False)
    return output_path


def _derive_version(genome_a: Dict, genome_b: Dict) -> float:
    versions = []
    for genome in (genome_a, genome_b):
        try:
            versions.append(float(genome.get("version", 0)))
        except (TypeError, ValueError):
            continue
    if versions:
        return max(versions)
    return 0.1


def main() -> None:
    parser = argparse.ArgumentParser(description="Module crossover operator")
    parser.add_argument("parent_a")
    parser.add_argument("parent_b")
    parser.add_argument("child")
    parser.add_argument("--agents-root", default=AGENTS_ROOT, type=Path)
    args = parser.parse_args()
    create_child(args.parent_a, args.parent_b, args.child, args.agents_root)


if __name__ == "__main__":
    main()
