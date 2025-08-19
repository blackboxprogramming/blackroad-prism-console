import json

import requests


class OllamaBackend:
    """
    Uses the local Ollama HTTP API:
      - Chat: POST /api/chat  with {"model","messages","stream":true,"options":{...}}
      - Models list: GET /api/tags
    """

    def __init__(self, host: str, default_model: str):
        self.host = host.rstrip("/")
        self.model = default_model

    def models(self):
        try:
            r = requests.get(f"{self.host}/api/tags", timeout=5)
            r.raise_for_status()
            data = r.json() or {}
            names = [m.get("name") for m in data.get("models", []) if m.get("name")]
            return {"backend": "ollama", "models": names}
        except Exception as e:
            return {"backend": "ollama", "error": str(e), "models": []}

    def health(self):
        info = self.models()
        ok = "error" not in info
        return {"ok": ok, **info}

    def stream_chat(self, messages, model=None, temperature=0.7, top_p=0.9, max_tokens=1024):
        url = f"{self.host}/api/chat"
        payload = {
            "model": model or self.model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
                "num_predict": max_tokens,
            },
        }
        with requests.post(url, json=payload, stream=True, timeout=720) as r:
            r.raise_for_status()
            for raw in r.iter_lines(decode_unicode=True):
                if not raw:
                    continue
                # Ollama streams NDJSON (one JSON object per line)
                try:
                    data = json.loads(raw)
                except Exception:
                    continue
                if data.get("done"):
                    break
                msg = data.get("message") or {}
                delta = msg.get("content")
                if delta:
                    yield delta

    def complete_chat(self, messages, model=None, temperature=0.7, top_p=0.9, max_tokens=1024):
        # Non-stream convenience wrapper: accumulate deltas
        acc = []
        for d in self.stream_chat(
            messages, model=model, temperature=temperature, top_p=top_p, max_tokens=max_tokens
        ):
            acc.append(d)
        return "".join(acc)
