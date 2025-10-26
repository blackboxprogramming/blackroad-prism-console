import os
import json
import glob

def load_json(p):
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def main():
    # Summarize every agent child with lineage+fitness if present
    rows = []
    for agent_dir in glob.glob("prism/agents/*/"):
        fitness = load_json(os.path.join(agent_dir, "fitness.json"))
        lineage = load_json(os.path.join(agent_dir, "lineage.json"))
        name = os.path.basename(os.path.dirname(agent_dir))
        if fitness or lineage:
            rows.append((name, fitness, lineage))
    # Emit markdown
    print("# Lucidia — Lineage & Fitness Report\n")
    if not rows:
        print("_No fitness/lineage artifacts found—create a child or ensure CI wrote outputs._")
        return
    for name, fitness, lineage in rows:
        print(f"## `{name}`")
        if lineage:
            parents = ", ".join(lineage.get("parents", []))
            ops = ", ".join(lineage.get("operators", []))
            print(f"- **Parents:** {parents}")
            print(f"- **Operators:** {ops}")
            print(f"- **Genome SHA256:** `{lineage.get('genome_sha256', 'n/a')}`")
        if fitness:
            agg = fitness.get("aggregate", "n/a")
            print(f"- **Aggregate fitness:** **{agg}**")
            metrics = {k:v for k,v in fitness.items() if k != "aggregate"}
            if metrics:
                print("  - Subscores: " + ", ".join(f"{k}={v}" for k,v in metrics.items()))
        print("")

if __name__ == "__main__":
    main()
