import requests, json, os

RETRIEVAL = os.getenv("RETRIEVAL_URL","http://localhost:8000")
TOKEN     = os.getenv("BEARER_TOKEN","blackroad-super-secret")
OLLAMA    = os.getenv("OLLAMA_URL","http://localhost:11434")
MODEL     = os.getenv("MODEL","llama3.1:8b-instruct")  # or phi3, mistral, etc.

def retrieve(q):
    r = requests.post(f"{RETRIEVAL}/query",
        headers={"Authorization": f"Bearer {TOKEN}","Content-Type":"application/json"},
        data=json.dumps({"queries":[{"query":q,"top_k":8,"filter":{"project":"blackroad"}}]}))
    r.raise_for_status()
    return r.json()["results"][0]["results"]

def ask(q):
    ctx = retrieve(q)
    ctx_lines = [f"[CTX:{c['id']} score={c['score']:.2f}] {c['text']}" for c in ctx]
    prompt = f"""You are CODEx. Use context to answer precisely.
Context:
{chr(10).join(ctx_lines) if ctx_lines else "(none)"}

Question: {q}
Answer with citations like [CTX:<id>].
"""
    gen = requests.post(f"{OLLAMA}/api/generate", json={"model": MODEL, "prompt": prompt, "stream": False})
    gen.raise_for_status()
    return gen.json()["response"]

if __name__ == "__main__":
    print(ask("Summarize Lucidia's role in BlackRoad."))
