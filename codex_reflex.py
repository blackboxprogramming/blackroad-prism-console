"""
Codex Reflex Trainer — Prism Console
Evolves agent reflex prompts based on feedback metrics and chain results.
Supports 'emoji coding' → emojis map to prompt modifiers and code intents.
"""

from __future__ import annotations

import datetime
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List

import yaml

FEEDBACK_FILE = Path("codex_logs/feedback_metrics.json")
CHAIN_FILE = Path("codex_logs/chain_runs.json")
REFLEX_DIR = Path("codex_prompts/reflex/")
EMOJI_MAP_FILE = REFLEX_DIR / "emoji_map.yaml"

# --- Default emoji meanings ---
DEFAULT_EMOJI_MAP: Dict[str, str] = {
    "🧠": "add deeper reasoning or self-reflection",
    "⚙️": "emphasize technical precision or code correctness",
    "🎨": "focus on creativity and design language",
    "🔢": "prioritize numeric computation accuracy",
    "🧩": "promote modular, reusable output",
    "💬": "expand explanation in natural language",
    "🕊️": "simplify wording / plain language mode",
    "🌀": "introduce fractal or chaotic simulation context",
    "🌐": "multilingual mode",
    "🛡️": "ethical / verification context",
    "🌱": "learning / self-improvement tone",
}


def _read_json_lines(path: Path, limit: int) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        lines = handle.readlines()[-limit:]
    entries: List[Dict[str, Any]] = []
    for raw in lines:
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            entries.append(parsed)
    return entries


def load_feedback() -> Dict[str, Any]:
    try:
        with FEEDBACK_FILE.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return {"agent_scores": {}}


def load_chains(limit: int = 50) -> List[Dict[str, Any]]:
    return _read_json_lines(CHAIN_FILE, limit)


def load_emoji_map() -> Dict[str, str]:
    REFLEX_DIR.mkdir(parents=True, exist_ok=True)
    if EMOJI_MAP_FILE.exists():
        with EMOJI_MAP_FILE.open("r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle) or {}
        if isinstance(data, dict):
            return {str(k): str(v) for k, v in data.items()}
    with EMOJI_MAP_FILE.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(DEFAULT_EMOJI_MAP, handle, sort_keys=True)
    return DEFAULT_EMOJI_MAP


def _extract_agent_chains(agent: str, chains: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    matches: List[Dict[str, Any]] = []
    for item in chains:
        agents = item.get("agents")
        if isinstance(agents, list) and agent in agents:
            matches.append(item)
    return matches


def _reflex_prompt_for_agent(agent: str, score: float, chains: Iterable[Dict[str, Any]]) -> str:
    base_prompt = f"Default reflex for {agent}-BOT."
    if score > 0.7:
        base_prompt += " 🧠⚙️ Keep complex reasoning strong."
    elif score > 0.5:
        base_prompt += " 🌱 Improve consistency."
    else:
        base_prompt += " 🕊️ Simplify and clarify output."

    text_records = [json.dumps(item).lower() for item in chains]
    if any("geometry" in record for record in text_records):
        base_prompt += " 🔢 Focus on geometric accuracy."
    if any("language" in record for record in text_records):
        base_prompt += " 💬 Expand clarity."
    if any("verify" in record for record in text_records):
        base_prompt += " 🛡️ Strengthen verification reflex."
    return base_prompt


def train_reflex() -> None:
    feedback = load_feedback().get("agent_scores", {})
    chains = load_chains()
    load_emoji_map()  # Ensure emoji map exists for reference even if unused here.

    print(f"[ReflexTrainer] agents={len(feedback)} chains={len(chains)}")

    for agent, score in feedback.items():
        try:
            numeric_score = float(score)
        except (TypeError, ValueError):
            numeric_score = 0.0

        reflex_file = REFLEX_DIR / f"{agent.lower()}_reflex.yaml"
        reflex_data = {
            "agent": agent,
            "updated": datetime.datetime.now().isoformat(),
            "prompt": _reflex_prompt_for_agent(agent, numeric_score, _extract_agent_chains(agent, chains)),
        }
        with reflex_file.open("w", encoding="utf-8") as handle:
            yaml.safe_dump(reflex_data, handle, sort_keys=False)
        print(f"  → updated {reflex_file}")

    print("[✓] Reflex prompts regenerated with emoji modifiers.")


def interpret_emoji(code: str, emoji_map: Dict[str, str] | None = None) -> str:
    """Replace emojis in code text with comments or explicit directives."""

    if emoji_map is None:
        emoji_map = load_emoji_map()
    for symbol, meaning in emoji_map.items():
        code = code.replace(symbol, f"#{symbol} {meaning}")
    return code


if __name__ == "__main__":
    train_reflex()
