from __future__ import annotations
from pathlib import Path

PROMPT_PATH = Path("src/prompts/codex_system.txt")

def load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")
