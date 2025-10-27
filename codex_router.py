"""Self-adapting router for Codex prompts."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict

import yaml

from bots.cecilia_bot import (
    CECILIA_AGENT_ID,
    CECILIA_ALIASES,
    CECILIA_LEGACY_NAME,
)
from codex_feedback import update_router_weights
from codex_prompts.dispatch_codex import run_codex_prompt

AGENT_RULES: Dict[str, str] = {
    "quantum|clifford|hamiltonian|bloch": "Helix",
    "tensor|optimization|gradient|system": "Silas",
    "visual|narrate|story|design|creative": CECILIA_AGENT_ID,
    "symbolic|proof|equation|derivative|integral": "Lucidia",
    "simulation|chaos|fractal|lorenz|automata": "Orion",
    "policy|fairness|ethic|verify|safety|constraint": "Vera",
    "language|translation|explain|natural|text": "Myra",
    "meta|theory|analysis|synthesis|research": "Anastasia",
    "time|temporal|series|evolution|recurrence": "Eon",
    "causal|fusion|multimodal|cross-agent": "Helix",
}

_CECILIA_ALIAS_MAP = {
    alias.lower(): CECILIA_AGENT_ID
    for alias in (set(CECILIA_ALIASES) | {CECILIA_AGENT_ID, CECILIA_LEGACY_NAME})
}


def _canonicalize_agent(agent: str) -> str:
    lowered = agent.strip().lower()
    return _CECILIA_ALIAS_MAP.get(lowered, agent)


def infer_agent(prompt_text: str) -> str:
    """Pick an agent by keyword pattern matching."""

    for pattern, agent in AGENT_RULES.items():
        if re.search(pattern, prompt_text, re.IGNORECASE):
            return _canonicalize_agent(agent)
    return "Lucidia"  # fallback


def _load_yaml(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
        if not isinstance(data, dict):
            raise ValueError(f"Prompt file must define a mapping: {path}")
        return data


def route_prompt(file_path: str | Path) -> Dict[str, Any]:
    """Read YAML, infer agent when missing, dispatch, and refresh router weights."""

    path = Path(file_path)
    data = _load_yaml(path)

    agent_value = data.get("agent")
    if isinstance(agent_value, str):
        canonical = _canonicalize_agent(agent_value)
        if canonical != agent_value:
            data["agent"] = canonical

    if not data.get("agent"):
        inferred = infer_agent(str(data.get("prompt", "")))
        data["agent"] = inferred
        with path.open("w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False)
        print(f"[→] Routed {path} to {inferred}-BOT")

    result = run_codex_prompt(path)
    update_router_weights()

    logs_dir = Path("codex_logs")
    logs_dir.mkdir(parents=True, exist_ok=True)
    stats_path = logs_dir / "router_stats.json"
    stats_entry: Dict[str, Any] = {"file": str(path), "agent": data.get("agent", "Lucidia")}
    with stats_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(stats_entry) + "\n")

    return result
