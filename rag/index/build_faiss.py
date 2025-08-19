#!/usr/bin/env python3
"""Build a lightweight FAISS index over repository docs."""

import argparse
import json
import os
import pathlib
import numpy as np

try:
    import faiss  # type: ignore
except Exception:  # pragma: no cover
    faiss = None


def gather_files(root_dirs):
    files = []
    for root in root_dirs:
        if not os.path.isdir(root):
            continue
        for path in pathlib.Path(root).rglob("*"):
            if path.suffix.lower() in {".md", ".txt", ".py"}:
                files.append(path)
    return files


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", default="rag/index")
    args = parser.parse_args()

    roots = ["prompts", "templates", "codex", "agents"]
    docs = gather_files(roots)
    vecs = []
    meta = {}
    for idx, path in enumerate(docs):
        with open(path, "r", errors="ignore") as f:
            _ = f.read()  # text unused in placeholder
        vecs.append(np.random.rand(384).astype("float32"))
        meta[idx] = str(path)

    if not vecs:  # ensure non-empty
        vecs.append(np.random.rand(384).astype("float32"))
        meta[0] = "dummy"

    os.makedirs(args.out_dir, exist_ok=True)
    arr = np.stack(vecs)
    index_path = os.path.join(args.out_dir, "lucidia.faiss")
    if faiss is not None:
        index = faiss.IndexFlatL2(arr.shape[1])
        index.add(arr)
        faiss.write_index(index, index_path)
    else:
        with open(index_path, "wb") as f:
            np.save(f, arr)
    with open(os.path.join(args.out_dir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"Indexed {len(vecs)} documents")


if __name__ == "__main__":
    main()
