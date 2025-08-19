import json

import requests

PROMPT_TPL = """[SYSTEM]
{system}

[CHAT]
{turns}

[ASSISTANT]
"""


def _format_chat_prompt(messages):
    sys = ""
    turns = []
    for m in messages:
        role = m.get("role")
        content = m.get("content", "")
        if role == "system":
            sys += content.strip() + "\n"
        elif role == "user":
            turns.append(f"User: {content.strip()}")
        elif role == "assistant":
            turns.append(f"Assistant: {content.strip()}")
    return PROMPT_TPL.format(system=sys.strip(), turns="\n".join(turns).strip())


class LlamaCppBackend:
    """
    Uses llama.cpp server (legacy /completion endpoint).
    Launch example: ./server -c 2048 -m models/llama-3.1.gguf --port 8080
    """

    def __init__(self, host: str, default_model: str):
        self.host = host.rstrip("/")
        self.model = default_model

    def models(self):
        # llama.cpp /completion doesn't list models; return configured name
        return {"backend": "llamacpp", "models": [self.model]}

    def health(self):
        try:
            r = requests.get(f"{self.host}/health", timeout=3)
            ok = r.status_code == 200
        except Exception:
            ok = False
        return {"ok": ok, **self.models()}

    def stream_chat(self, messages, model=None, temperature=0.7, top_p=0.9, max_tokens=1024):
        prompt = _format_chat_prompt(messages)
        url = f"{self.host}/completion"
        payload = {
            "prompt": prompt,
            "n_predict": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "stream": True,
            "cache_prompt": True,
        }
        with requests.post(url, json=payload, stream=True, timeout=720) as r:
            r.raise_for_status()
            # llama.cpp streams SSE 'data: {...}\n\n'
            for raw in r.iter_lines(decode_unicode=True):
                if not raw:
                    continue
                if raw.startswith("data:"):
                    raw = raw[len("data:") :].strip()
                try:
                    data = json.loads(raw)
                except Exception:
                    continue
                token = data.get("content")
                if token:
                    yield token
                if data.get("stop") or data.get("stopped"):
                    break

    def complete_chat(self, messages, model=None, temperature=0.7, top_p=0.9, max_tokens=1024):
        acc = []
        for d in self.stream_chat(
            messages, model=model, temperature=temperature, top_p=top_p, max_tokens=max_tokens
        ):
            acc.append(d)
        return "".join(acc)
