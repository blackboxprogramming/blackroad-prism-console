import json, hashlib, time, os

def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def write_lineage(out_path: str, *, child_id: str, parents: list, operators: list, genome_path: str):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    entry = {
        "child_id": child_id,
        "parents": parents,
        "operators": operators,
        "genome_path": genome_path,
        "genome_sha256": sha256_file(genome_path),
        "ts": int(time.time())
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(entry, f, indent=2)
    return entry
