from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Lucidia LLM Stub", version="0.1.0")

class ChatRequest(BaseModel):
    prompt: str
    system: Optional[str] = None
    stream: Optional[bool] = False

class ChatResponse(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # Simple echo stub; replace with real model integration as needed.
    prefix = (req.system + " ") if req.system else ""
    return {"text": f"{prefix}LLM stub response to: {req.prompt}"}
