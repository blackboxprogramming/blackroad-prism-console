import json, os, requests
from dataclasses import dataclass
from typing import Optional, Dict, Any

SHAP_E_URL = os.environ.get("SHAP_E_URL", "http://127.0.0.1:8045")

@dataclass
class ShapETask:
    mode: str              # "text" or "image"
    prompt: Optional[str]  # required for text
    image_path: Optional[str] = None
    steps: int = 64
    guidance_scale: float = 15.0
    batch_size: int = 1
    seed: Optional[int] = None
    output: str = "glb,preview"

def generate(task: ShapETask) -> Dict[str, Any]:
    if task.mode == "text":
        payload = dict(
            prompt=task.prompt,
            steps=task.steps,
            guidance_scale=task.guidance_scale,
            batch_size=task.batch_size,
            seed=task.seed,
            output=task.output.split(","),
        )
        r = requests.post(f"{SHAP_E_URL}/text", json=payload, timeout=1800)
    elif task.mode == "image":
        if not task.image_path or not os.path.exists(task.image_path):
            raise FileNotFoundError(f"Missing image_path: {task.image_path}")
        files = {"image": open(task.image_path, "rb")}
        data = dict(
            steps=str(task.steps),
            guidance_scale=str(task.guidance_scale),
            batch_size=str(task.batch_size),
            seed=str(task.seed) if task.seed is not None else "",
            output=task.output,
        )
        r = requests.post(f"{SHAP_E_URL}/image", files=files, data=data, timeout=1800)
    else:
        raise ValueError("mode must be 'text' or 'image'")
    r.raise_for_status()
    return r.json()
