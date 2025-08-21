from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional
import os, yaml

class BotCfg(BaseModel):
    name: str
    default_backend: str
    thread_close_after_messages: int
    max_context_messages: int
    temperature: float
    max_tokens: int

class PermCfg(BaseModel):
    allowed_server_ids: List[int]

class LucidiaCfg(BaseModel):
    base_url_env: str
    route: str
    timeout_seconds: int

class OllamaCfg(BaseModel):
    base_url_env: str
    model: str
    timeout_seconds: int

class ModerationCfg(BaseModel):
    blocklist: List[str]
    redact_pii_patterns: List[str]
    action: str

class AppCfg(BaseModel):
    bot: BotCfg
    permissions: PermCfg
    lucidia: LucidiaCfg
    ollama: OllamaCfg
    moderation: ModerationCfg

def load_config(path: str = "src/config.yaml") -> AppCfg:
    with open(path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    cfg = AppCfg(**raw)
    return cfg

def env(name: str, default: Optional[str] = None) -> str:
    v = os.getenv(name, default)
    if v is None:
        raise RuntimeError(f"Missing required env var: {name}")
    return v
