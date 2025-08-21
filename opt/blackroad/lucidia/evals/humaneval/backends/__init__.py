from typing import Dict, Any
from .ollama_backend import OllamaBackend
from .llamacpp_backend import LlamaCppBackend

try:
    from .transformers_backend import TransformersBackend
    HAS_HF = True
except Exception:
    HAS_HF = False

def make_backend(name: str, params: Dict[str, Any]):
    name = name.lower()
    if name == "ollama":
        return OllamaBackend(**params)
    if name == "llamacpp":
        return LlamaCppBackend(**params)
    if name == "transformers":
        if not HAS_HF:
            raise RuntimeError("Transformers backend requested but transformers/torch not installed.")
        return TransformersBackend(**params)
    raise ValueError(f"Unknown backend: {name}")
