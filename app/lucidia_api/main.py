from fastapi import FastAPI, Body
import requests
import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://10.0.0.10:11434")

app = FastAPI()

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.post("/chat")
def chat(prompt: str = Body(..., embed=True)):
    resp = requests.post(f"{OLLAMA_URL}/api/generate", json={"model": "llama3", "prompt": prompt})
    resp.raise_for_status()
    return resp.json()
