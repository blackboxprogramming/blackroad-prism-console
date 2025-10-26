"""
LoRA adapter merge (weighted) using safetensors (numpy backend).
This does NOT require PyTorch; merges parameter tensors as numpy arrays.

Usage (library):
    from merge_lora import fisher_merge
    merged = fisher_merge([("a.safetensors", 0.6), ("b.safetensors", 0.4)], out_path="merged.safetensors")

Notes:
- This is a simple weighted average merge, a proxy for Fisher-weighted merge when you only have scalar weights.
- For true Fisher merges, pass Fisher weights already baked into the scalar weights, or extend this to accept per-tensor fishers.
"""
from typing import List, Tuple, Dict
import os, uuid
try:
    import numpy as np
    from safetensors.numpy import load_file, save_file
except Exception as e:
    raise ImportError("Please `pip install safetensors numpy` to use adapter merging") from e


def _validate(paths_with_weights: List[Tuple[str, float]]):
    assert len(paths_with_weights) >= 2, "Need >=2 adapters to merge"
    total = sum(w for _, w in paths_with_weights)
    assert total > 0, "Weights must sum to > 0"


def fisher_merge(paths_with_weights: List[Tuple[str, float]], out_path: str = None) -> Dict[str, str]:
    _validate(paths_with_weights)
    # Normalize weights
    total = float(sum(w for _, w in paths_with_weights))
    norm = [(p, float(w)/total) for p, w in paths_with_weights]

    # Load first to initialize
    base_path, base_w = norm[0]
    accum = {k: v.astype("float32") * base_w for k, v in load_file(base_path).items()}

    # Accumulate others
    for p, w in norm[1:]:
        data = load_file(p)
        # Ensure matching keys
        missing = set(accum.keys()) ^ set(data.keys())
        if missing:
            raise ValueError(f"Adapter key mismatch between {base_path} and {p}. Diff: {sorted(list(missing))[:10]} ...")
        for k in accum.keys():
            accum[k] = accum[k] + data[k].astype("float32") * w

    # Save
    if out_path is None:
        out_dir = os.path.dirname(paths_with_weights[0][0]) or "."
        out_path = os.path.join(out_dir, f"merged_{uuid.uuid4().hex[:8]}.safetensors")
    save_file(accum, out_path)
    return {"merged_path": out_path}
