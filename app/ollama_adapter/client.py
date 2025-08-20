import os
import requests

class OllamaClient:
    def __init__(self, base_url: str | None = None):
        self.base = base_url or os.getenv("OLLAMA_URL", "http://10.0.0.10:11434")

    def generate(self, model: str, prompt: str) -> dict:
        resp = requests.post(f"{self.base}/api/generate", json={"model": model, "prompt": prompt})
        resp.raise_for_status()
        return resp.json()
