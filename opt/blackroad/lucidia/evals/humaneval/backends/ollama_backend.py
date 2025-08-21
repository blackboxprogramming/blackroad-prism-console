import requests, json
from typing import List, Optional

class OllamaBackend:
    def __init__(self, host: str="http://localhost:11434", model: str="codellama:7b-instruct-q4_K_M",
                 timeout_s: int=60, max_tokens: int=256, temperature: float=0.2, top_p: float=0.95,
                 stop: Optional[List[str]]=None):
        self.host = host.rstrip("/")
        self.model = model
        self.timeout_s = timeout_s
        self.default = dict(max_tokens=max_tokens, temperature=temperature, top_p=top_p, stop=stop or [])

    def generate(self, prompt: str, max_tokens: int, temperature: float, top_p: float, stop, timeout_s: int) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "stop": stop or []
            }
        }
        r = requests.post(f"{self.host}/api/generate", json=payload, timeout=timeout_s)
        r.raise_for_status()
        data = r.json()
        return data.get("response", "")
