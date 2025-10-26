import argparse, json, os, yaml, sys, uuid, datetime
from operators.crossover_modules import crossover
from lineage import write_lineage
from fitness import evaluate_child

def _load_yaml(p):
    with open(p, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def _require(b, msg):
    if not b:
        print(f"[ERROR] {msg}", file=sys.stderr)
        sys.exit(1)

def main():
    ap = argparse.ArgumentParser(description="Lucidia consent-based reproduction")
    ap.add_argument("--p1", required=True, help="Parent1 genome.yaml path")
    ap.add_argument("--p2", required=True, help="Parent2 genome.yaml path")
    ap.add_argument("--child", required=True, help="Child species name, e.g., lucidia/analyst")
    ap.add_argument("--consent", required=True, help="Consent JSON path")
    ap.add_argument("--outdir", default="../../agents", help="Agents directory to write child into")
    args = ap.parse_args()

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
    child_dir = os.path.join(os.path.dirname(args.outdir), child_name) if args.outdir.endswith(args.child) else os.path.join(args.outdir, child_name)
    os.makedirs(child_dir, exist_ok=True)
    child_genome_path = os.path.join(child_dir, "genome.yaml")

    # Perform crossover
    child = crossover(args.p1, args.p2, child_genome_path, args.child)

    # Values check: enforce love-first for infants
    values_gene = next((g for g in child.get("genes", []) if g.get("type")=="values"), None)
    _require(values_gene and "love-first" in values_gene.get("tags", []), "child must include 'love-first' tag")

    # Evaluate
    metrics = evaluate_child(child)
    with open(os.path.join(child_dir, "fitness.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    # Lineage
    lineage_path = os.path.join(child_dir, "lineage.json")
    child_id = f"{child_name}-{uuid.uuid4().hex[:8]}"
    write_lineage(lineage_path,
                  child_id=child_id,
                  parents=[p["id"] for p in parents],
                  operators=ops,
                  genome_path=child_genome_path)

    print("[OK] child:", child_id)
    print("[OK] genome:", child_genome_path)
    print("[OK] fitness:", metrics)

if __name__ == "__main__":
    main()
