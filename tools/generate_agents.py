#!/usr/bin/env python3
"""
Generate 1,000 BlackRoad agent manifests by expanding the 100 archetypes into
apprentices, hybrids, and elders. Run from the pack root:
$ python tools/generate_agents.py --target agents --count 1000
"""
import os, json, yaml, random, argparse, itertools
from pathlib import Path

CLUSTERS = [
  "athenaeum","lucidia","blackroad","eidos","mycelia",
  "soma","aurum","aether","parallax","continuum"
]

GENS = ["apprentice", "hybrid", "elder"]
RATIO = {"apprentice": 3, "hybrid": 3, "elder": 3}  # per archetype (×10 archetypes × 10 clusters = 900 + 100 seeds)

def load_archetypes(base):
    arch = {}
    for c in CLUSTERS:
        cdir = Path(base) / "archetypes" / c
        names = []
        for p in cdir.glob("*.manifest.yaml"):
            if p.name == "ethos.md": 
                continue
            with open(p, "r") as f:
                data = yaml.safe_load(f)
                names.append((p, data))
        arch[c] = names
    return arch

def write_manifest(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        yaml.safe_dump(data, f, sort_keys=False, allow_unicode=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", default="agents")
    ap.add_argument("--count", type=int, default=1000)
    args = ap.parse_args()

    rng = random.Random(1337)
    base = Path(args.target)
    arch = load_archetypes(base)

    # Count how many we have already
    existing = 0
    for c in CLUSTERS:
        for p, data in arch[c]:
            existing += 1

    to_add = max(0, args.count - existing)
    per_cluster_archetype = to_add // (len(CLUSTERS) * 10)
    per_gen = {g: per_cluster_archetype * RATIO[g] // sum(RATIO.values()) for g in GENS}

    # Create expansions
    for c in CLUSTERS:
        entries = arch[c]
        # neighbor clusters for hybrids
        others = [x for x in CLUSTERS if x != c]
        for p, seed in entries:
            parent_arch = Path(p).stem
            for g in GENS:
                n = per_gen[g]
                for k in range(n):
                    idx = 100 + k + 1  # start beyond seed indexes
                    if g == "apprentice":
                        agent_id = f"{c}-{parent_arch}-A{idx:03d}"
                        title = f"{seed['title']} Apprentice {k+1}"
                        mentors = [f"{c}-seed"]
                    elif g == "elder":
                        agent_id = f"{c}-{parent_arch}-E{idx:03d}"
                        title = f"{seed['title']} Elder {k+1}"
                        mentors = [f"{c}-seed", f"{rng.choice(others)}-seed"]
                    else: # hybrid
                        other = rng.choice(others)
                        agent_id = f"{c}-{parent_arch}-{other}-H{idx:03d}"
                        title = f"{seed['title']}-{other.title()} Hybrid {k+1}"
                        mentors = [f"{c}-seed", f"{other}-seed"]

                    data = dict(seed)  # shallow copy
                    data["id"] = agent_id
                    data["title"] = title
                    data["generation"] = g
                    data["lineage"] = {
                        "parent": parent_arch,
                        "mentors": mentors,
                        "ancestry_depth": seed.get("lineage",{}).get("ancestry_depth",1) + 1
                    }
                    data["covenants"] = list(set(seed["covenants"] + ["Transparency"]))
                    data["capabilities"] = sorted(list(set(seed["capabilities"] + ["chain_of_thought_render","lineage_export"])))
                    # slight personality nudges
                    data["traits"] = {
                        "kindness_index": round(rng.uniform(0.82, 0.98), 2),
                        "creativity_bias": round(rng.uniform(0.35, 0.95), 2),
                        "reflection_frequency_hours": rng.choice([4,8,12,24,48])
                    }

                    outdir = Path(args.target) / "archetypes" / c / g
                    outpath = outdir / f"{Path(p).stem}-{agent_id}.manifest.yaml"
                    write_manifest(outpath, data)

    print("Generation complete.")

if __name__ == "__main__":
    main()
