import argparse, json, os, yaml, sys, uuid
import argparse, json, sys, uuid
from pathlib import Path
from operators.crossover_modules import crossover
from lineage import write_lineage
from fitness import evaluate_child

def _require(b, msg):
    if not b:
        print(f"[ERROR] {msg}", file=sys.stderr)
        sys.exit(1)

def _find_loras(genome):
    return [g for g in genome.get("genes", []) if g.get("type") == "skill_lora"]

def main():
    ap = argparse.ArgumentParser(description="Lucidia consent-based reproduction")
    ap.add_argument("--p1", required=True, help="Parent1 genome.yaml path")
    ap.add_argument("--p2", required=True, help="Parent2 genome.yaml path")
    ap.add_argument("--child", required=True, help="Child species name, e.g., lucidia/analyst")
    ap.add_argument("--consent", required=True, help="Consent JSON path")
    ap.add_argument("--outdir", default="../../agents", help="Agents directory to write child into")
    ap.add_argument("--adapter-weights", default=None,
                    help="Comma list of weights for adapter_merge, e.g. '0.6,0.4' (requires operators/merge_lora.py)")
    default_outdir = Path(__file__).resolve().parent.parent / "agents"
    ap.add_argument("--outdir", default=None, help="Agents directory to write child into")
    args = ap.parse_args()

    outdir = Path(args.outdir).expanduser() if args.outdir else default_outdir
    outdir.mkdir(parents=True, exist_ok=True)

    # Validate consent
    with open(args.consent, "r", encoding="utf-8") as f:
        consent = json.load(f)
    _require(consent.get("license_ok") is True, "license_ok must be true")
    parents = consent.get("parents", [])
    _require(len(parents) >= 2, "need >=2 parents")
    for p in parents:
        _require(p.get("id"), "parent id missing")
        _require(p.get("consent_token") and len(p.get("consent_token")) >= 8, "consent_token invalid")

    ops = consent.get("operators", [])
    _require("module_crossover" in ops, "module_crossover operator required")
    caps = consent.get("safety_caps", {})
    _require(caps.get("network_access") is False, "network_access must be false for infants")
    _require(caps.get("external_write") is False, "external_write must be false for infants")

    child_name = args.child.split("/")[-1]
    child_dir = (outdir / child_name).resolve()
    child_dir.mkdir(parents=True, exist_ok=True)
    child_genome_path = child_dir / "genome.yaml"

    # Perform crossover
    child = crossover(args.p1, args.p2, str(child_genome_path), args.child)

    # Optional: adapter_merge
    if "adapter_merge" in ops:
        try:
            from operators.merge_lora import fisher_merge
            p1 = _load_yaml(args.p1)
            p2 = _load_yaml(args.p2)
            l1 = _find_loras(p1)
            l2 = _find_loras(p2)
            if l1 and l2:
                # Use first lora from each parent for demo purposes
                a_path = l1[0].get("path")
                b_path = l2[0].get("path")
                weights = [0.5, 0.5]
                if args.adapter_weights:
                    parts = [float(x) for x in args.adapter_weights.split(",")]
                    if len(parts) == 2:
                        weights = parts
                merged = fisher_merge([(a_path, weights[0]), (b_path, weights[1])],
                                      out_path=os.path.join(os.path.dirname(child_genome_path), f"merged_{child_name}.safetensors"))
                # Append merged lora gene
                child.setdefault("genes", []).append({
                    "type": "skill_lora",
                    "name": "merged_skill",
                    "path": merged["merged_path"],
                    "weight": 1.0
                })
                with open(child_genome_path, "w", encoding="utf-8") as f:
                    yaml.safe_dump(child, f, sort_keys=False)
        except Exception as e:
            print(f"[WARN] adapter_merge requested but failed: {e}")

    # Values check: enforce love-first for infants
    values_gene = next((g for g in child.get("genes", []) if g.get("type")=="values"), None)
    _require(values_gene and "love-first" in values_gene.get("tags", []), "child must include 'love-first' tag")

    # Evaluate
    metrics = evaluate_child(child)
    with open(child_dir / "fitness.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    # Lineage
    lineage_path = child_dir / "lineage.json"
    child_id = f"{child_name}-{uuid.uuid4().hex[:8]}"
    from lineage import write_lineage
    write_lineage(lineage_path,
    write_lineage(
                  str(lineage_path),
                  child_id=child_id,
                  parents=[p["id"] for p in parents],
                  operators=ops,
                  genome_path=str(child_genome_path))

    print("[OK] child:", child_id)
    print("[OK] genome:", str(child_genome_path))
    print("[OK] fitness:", metrics)

if __name__ == "__main__":
    main()
