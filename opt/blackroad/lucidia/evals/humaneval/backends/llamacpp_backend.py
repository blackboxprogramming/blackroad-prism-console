import requests
from typing import List, Optional

class LlamaCppBackend:
    def __init__(self, host: str="http://localhost:8080",
                 timeout_s: int=60, max_tokens: int=256, temperature: float=0.2, top_p: float=0.95,
                 stop: Optional[List[str]]=None):
        self.host = host.rstrip("/")
        self.timeout_s = timeout_s
        self.default = dict(max_tokens=max_tokens, temperature=temperature, top_p=top_p, stop=stop or [])

    def generate(self, prompt: str, max_tokens: int, temperature: float, top_p: float, stop, timeout_s: int) -> str:
        # llama.cpp server /completion API
        payload = {
            "prompt": prompt,
            "n_predict": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "stop": stop or [],
            "stream": False
        }
        r = requests.post(f"{self.host}/completion", json=payload, timeout=timeout_s)
        r.raise_for_status()
        data = r.json()
        # The server may return either {"content": "..."} or {"completion": "..."} depending on build
        return data.get("content") or data.get("completion") or ""
