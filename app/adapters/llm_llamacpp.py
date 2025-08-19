

from __future__ import annotations
from typing import Optional
from app.state import LLAMACPP
try:
    from llama_cpp import Llama
except Exception:  # pragma: no cover
    Llama = None

class LlamaCppAdapter:
    def __init__(self):
        if Llama is None:
            raise RuntimeError("llama-cpp-python not installed.")
        self.llm = Llama(
            model_path=LLAMACPP.get("model_path"),
            n_ctx=LLAMACPP.get("n_ctx", 4096),
            n_threads=LLAMACPP.get("n_threads", 4)
        )
        self.temperature = LLAMACPP.get("temperature", 0.2)

    def generate(self, prompt: str, system: Optional[str] = None) -> str:
        full = prompt if not system else f"{system}\n\n{prompt}"
        out = self.llm(full, temperature=self.temperature, max_tokens=768)
        return (out.get("choices", [{}])[0].get("text") or "").strip()

