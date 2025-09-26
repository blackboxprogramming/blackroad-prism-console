"""FastAPI application for BlackroadLM."""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel
import toml


def load_persona(name: str) -> dict:
    """Load persona configuration from the personas directory."""
    persona_path = Path(__file__).parent / "personas" / f"{name}.toml"
    if not persona_path.exists():
        raise FileNotFoundError(f"Persona '{name}' not found")
    return toml.loads(persona_path.read_text())


class ChatRequest(BaseModel):
    persona: str
    messages: list
    temperature: float | None = None


class ChatResponse(BaseModel):
    persona: str
    reply: str


app = FastAPI(title="BlackroadLM")


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    persona_cfg = load_persona(req.persona)
    # Placeholder echo response
    last_message = req.messages[-1] if req.messages else ""
    reply = f"{persona_cfg['system']['prompt']} | Echo: {last_message}"
    return ChatResponse(persona=req.persona, reply=reply)


def create_app() -> FastAPI:
    """Factory for application instances."""
    return app
