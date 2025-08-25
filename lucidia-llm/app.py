# FILE: /srv/lucidia-llm/app.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Lucidia LLM Stub")

class Msg(BaseModel):
    role: str
    content: str

class ChatReq(BaseModel):
    messages: List[Msg]

@app.get("/health")
def health():
    return {"ok": True, "service": "lucidia-llm-stub"}

@app.post("/chat")
def chat(req: ChatReq):
    last = req.messages[-1].content if req.messages else "(empty)"
    # Simple echo stub
    return {"choices": [{"role": "assistant", "content": f"Lucidia stub: {last}"}]}
