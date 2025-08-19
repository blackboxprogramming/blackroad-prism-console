# Thin agent that Lucidia can import/call. Keeps logs, supports "chit chat" text->class via a local map.
import json
import time
from pathlib import Path
from typing import Any, Dict, Optional

import requests
import yaml

HERE = Path(__file__).resolve().parent
CFG = yaml.safe_load(open(HERE / "config.yaml"))
SERVICE_URL = "http://127.0.0.1:8009"

LOG_DIR = HERE / "runs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Optional label mapping helper (string -> class_id)
try:
    from text_label_map import lookup_class_id
except Exception:

    def lookup_class_id(text: str) -> Optional[int]:
        return None  # degrade gracefully


def generate(
    text_or_class: str | int,
    n: int = 4,
    image_size: int = 256,
    classifier_scale: float = 1.0,
    seed: Optional[int] = None,
    timestep_respacing: str = "250",
    diffusion_path: Optional[str] = None,
    classifier_path: Optional[str] = None,
) -> Dict[str, Any]:
    if isinstance(text_or_class, int):
        class_id = text_or_class
    else:
        cid = lookup_class_id(text_or_class)
        if cid is None:
            raise ValueError(
                f"Could not map '{text_or_class}' to a class_id. Provide integer class_id or install label map."
            )
        class_id = cid

    payload = dict(
        image_size=image_size,
        num_samples=n,
        batch_size=min(n, CFG["defaults"]["batch_size"]),
        seed=seed,
        timestep_respacing=timestep_respacing,
        class_id=class_id,
        classifier_scale=classifier_scale,
        diffusion_path=diffusion_path,
        classifier_path=classifier_path,
    )
    r = requests.post(f"{SERVICE_URL}/sample", json=payload, timeout=60 * 60)
    r.raise_for_status()
    out = r.json()

    # Log for Codex Infinity
    ts = time.strftime("%Y%m%d-%H%M%S")
    (LOG_DIR / f"log_{ts}.json").write_text(
        json.dumps({"request": payload, "response": out}, indent=2)
    )
    return out


if __name__ == "__main__":
    # Simple smoke test:
    print(generate(207, n=2))  # 207 ~ golden retriever (if ImageNet mapping used)
