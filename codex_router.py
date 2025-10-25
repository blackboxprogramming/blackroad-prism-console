"""Simple Codex router wrapper that ensures feedback weights stay fresh."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from codex_feedback import update_router_weights
from codex_prompts.dispatch_codex import run_codex_prompt


def route_prompt(file_path: str | Path) -> dict[str, Any]:
    """Route a prompt file through the dispatcher and refresh router weights."""
    result = run_codex_prompt(file_path)
    update_router_weights()
    return result
