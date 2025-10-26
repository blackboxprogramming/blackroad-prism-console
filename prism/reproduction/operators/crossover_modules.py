"""Module crossover operator for Lucidia genomes."""

from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
from typing import Dict, Iterable, List

import yaml


def _load_genome(path: Path) -> Dict:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def _canonical(gene: Dict) -> str:
    return json.dumps(gene, sort_keys=True)


def _dedupe(genes: Iterable[Dict]) -> List[Dict]:
    seen = set()
    result: List[Dict] = []
    for gene in genes:
        marker = _canonical(gene)
        if marker in seen:
            continue
        seen.add(marker)
        result.append(gene)
    return result


def _merge_tool_rights(parent_a: List[Dict], parent_b: List[Dict]) -> Dict | None:
    tools = []
    rate_limits: Dict[str, int] = {}
    for gene in parent_a + parent_b:
        if gene.get("type") != "tool_rights":
            continue
        tools.extend(gene.get("tools", []))
        for key, value in (gene.get("rate_limits") or {}).items():
            current = rate_limits.get(key)
            if current is None:
                rate_limits[key] = value
            else:
                rate_limits[key] = min(current, value)
    if not tools and not rate_limits:
        return None
    merged: Dict[str, object] = {"type": "tool_rights"}
    if tools:
        merged["tools"] = sorted(set(tools))
    if rate_limits:
        merged["rate_limits"] = rate_limits
    return merged


def _intersect_values(parent_a: List[Dict], parent_b: List[Dict]) -> List[Dict]:
    values_a = {
        _canonical(gene): gene
        for gene in parent_a
        if gene.get("type") == "values"
    }
    values_b = {
        _canonical(gene): gene
        for gene in parent_b
        if gene.get("type") == "values"
    }
    shared_keys = values_a.keys() & values_b.keys()
    return [copy.deepcopy(values_a[key]) for key in shared_keys]


def _merge_other_genes(parent_a: List[Dict], parent_b: List[Dict]) -> List[Dict]:
    remaining = [
        gene
        for gene in parent_a + parent_b
        if gene.get("type") not in {"tool_rights", "values"}
    ]
    return _dedupe(remaining)


def _average_hormones(parent_a: Dict, parent_b: Dict) -> Dict:
    hormones_a = parent_a.get("hormones") or {}
    hormones_b = parent_b.get("hormones") or {}
    keys = set(hormones_a) | set(hormones_b)
    averaged: Dict[str, float] = {}
    for key in keys:
        value_a = hormones_a.get(key)
        value_b = hormones_b.get(key)
        values = [value for value in (value_a, value_b) if isinstance(value, (int, float))]
        if values:
            averaged[key] = sum(values) / len(values)
    return averaged


def _merge_caps(parent_a: Dict, parent_b: Dict) -> Dict:
    caps_a = ((parent_a.get("lifecycle") or {}).get("caps")) or {}
    caps_b = ((parent_b.get("lifecycle") or {}).get("caps")) or {}
    keys = set(caps_a) | set(caps_b)
    merged_caps: Dict[str, bool] = {}
    for key in keys:
        value_a = caps_a.get(key)
        value_b = caps_b.get(key)
        if isinstance(value_a, bool) and isinstance(value_b, bool):
            merged_caps[key] = value_a and value_b
        elif isinstance(value_a, bool):
            merged_caps[key] = value_a
        elif isinstance(value_b, bool):
            merged_caps[key] = value_b
    return merged_caps


def crossover_modules(parent_a_path: Path, parent_b_path: Path, child_name: str, output_root: Path | None = None) -> Path:
    """Perform module crossover between two parent genomes."""

    output_root = output_root or Path("prism/agents")
    parent_a = _load_genome(parent_a_path)
    parent_b = _load_genome(parent_b_path)

    child = copy.deepcopy(parent_a)
    species_label = child_name.replace("-", "/")
    child["species"] = species_label

    genes_a = parent_a.get("genes", [])
    genes_b = parent_b.get("genes", [])

    merged_genes: List[Dict] = []
    merged_genes.extend(_merge_other_genes(genes_a, genes_b))
    tool_gene = _merge_tool_rights(genes_a, genes_b)
    if tool_gene:
        merged_genes.append(tool_gene)
    value_genes = _intersect_values(genes_a, genes_b)
    merged_genes.extend(value_genes)
    child["genes"] = merged_genes

    child["hormones"] = _average_hormones(parent_a, parent_b)

    lifecycle = copy.deepcopy(parent_a.get("lifecycle") or {})
    lifecycle["phase"] = "infant"
    if lifecycle:
        lifecycle_caps = lifecycle.get("caps") or {}
        lifecycle_caps.update(_merge_caps(parent_a, parent_b))
        lifecycle["caps"] = lifecycle_caps
    child["lifecycle"] = lifecycle

    child_dir = output_root / child_name
    child_dir.mkdir(parents=True, exist_ok=True)
    output_path = child_dir / "genome.yaml"
    with output_path.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(child, handle, sort_keys=False)
    return output_path


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Module crossover operator")
    parser.add_argument("parent_a", type=Path, help="Path to parent A genome")
    parser.add_argument("parent_b", type=Path, help="Path to parent B genome")
    parser.add_argument("child", help="Child agent directory name")
    parser.add_argument("--output-root", type=Path, default=Path("prism/agents"), help="Agents root directory")
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    crossover_modules(args.parent_a, args.parent_b, args.child, args.output_root)


if __name__ == "__main__":
    main()
