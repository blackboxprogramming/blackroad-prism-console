"""Self-Adapting Codex Router — infers agents for Codex prompts."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import yaml

from codex_prompts.dispatch_codex import run_codex_prompt

# Simple rule-based classifier; replace later with an LLM classifier if desired.
AGENT_RULES = {
    "quantum|clifford|hamiltonian|bloch": "Helix",
    "tensor|optimization|gradient|system": "Silas",
    "visual|narrate|story|design|creative": "Cecilia",
    "symbolic|proof|equation|derivative|integral": "Lucidia",
    "simulation|chaos|fractal|lorenz|automata": "Orion",
    "policy|fairness|ethic|verify|safety|constraint": "Vera",
    "language|translation|explain|natural|text": "Myra",
    "meta|theory|analysis|synthesis|research": "Anastasia",
    "time|temporal|series|evolution|recurrence": "Eon",
    "causal|fusion|multimodal|cross-agent": "Helix",
}


def infer_agent(prompt_text: str) -> str:
    """Pick an agent by keyword pattern matching."""
    for pattern, agent in AGENT_RULES.items():
        if re.search(pattern, prompt_text, re.IGNORECASE):
            return agent
    return "Lucidia"  # fallback


def _load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
        if not isinstance(data, dict):
            raise ValueError(f"Prompt file must define a mapping: {path}")
        return data


def route_prompt(file_path: str | Path) -> dict[str, Any]:
    """Read YAML, infer agent when missing, and dispatch via run_codex_prompt."""
    path = Path(file_path)
    data = _load_yaml(path)

    if not data.get("agent"):
        inferred = infer_agent(str(data.get("prompt", "")))
        data["agent"] = inferred
        with path.open("w", encoding="utf-8") as handle:
            yaml.safe_dump(data, handle, sort_keys=False)
        print(f"[→] Routed {path} to {inferred}-BOT")

    result = run_codex_prompt(path)

    logs_dir = Path("codex_logs")
    logs_dir.mkdir(parents=True, exist_ok=True)
    stats_path = logs_dir / "router_stats.json"
    stats_entry: dict[str, Any] = {"file": str(path), "agent": data.get("agent", "Lucidia")}
    with stats_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(stats_entry) + "\n")

    return result
