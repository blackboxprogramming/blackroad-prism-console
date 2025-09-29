"""FastAPI app exposing BlackRoad device agent endpoints."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI

from agent import models

app = FastAPI(title="BlackRoad Agent API")


@app.get("/models")
def models_list() -> Dict[str, Any]:
    """Return available local GGUF/BIN models."""

    return {"models": models.list_models()}


@app.post("/models/run")
def models_run(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Run a llama.cpp model once with the provided prompt."""

    model = (payload or {}).get("model")
    prompt = (payload or {}).get("prompt", "")
    n_raw = (payload or {}).get("n", 128)

    if not model or not prompt:
        return {"error": "model and prompt required"}

    try:
        n_predict = max(1, int(n_raw))
    except (TypeError, ValueError):
        return {"error": "n must be an integer"}

    model_path = Path(model)
    if not model_path.exists():
        candidate = models.MODELS_DIR / model
        model_path = candidate if candidate.exists() else model_path

    try:
        resolved = model_path.resolve(strict=True)
    except FileNotFoundError:
        return {"error": f"model not found: {model}"}

    try:
        resolved.relative_to(models.MODELS_DIR.resolve())
    except ValueError:
        return {"error": "model must live under /var/lib/blackroad/models"}

    return models.run_llama(str(resolved), prompt, n_predict=n_predict)
