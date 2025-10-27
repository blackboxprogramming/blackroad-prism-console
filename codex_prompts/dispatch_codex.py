"""
Codex Integration Dispatcher — Prism Console
Coordinates Codex prompt execution across agents.
"""

from __future__ import annotations

import datetime
import json
import os
from pathlib import Path
from typing import Any, Dict

import yaml

from lucidia_mathlab.memory_graph import MemoryGraph
from bots.cecilia_bot import CECILIA_AGENT_ID, CECILIA_ALIASES

REFLEX_ROOT = Path("codex_prompts/reflex")

# --- Agent Simulation Placeholder ---
# Replace with your real API clients or async agent calls.
def _cecilia_response(prompt: str) -> str:
    return f"[{CECILIA_AGENT_ID} spectrum narration simulated for: {prompt[:80]}...]"


AGENTS = {
    "Lucidia": lambda prompt: f"[Lucidia output simulated for: {prompt[:80]}...]",
    "Cadillac": lambda prompt: f"[Cadillac codegen simulated for: {prompt[:80]}...]",
    CECILIA_AGENT_ID: _cecilia_response,
    "Silas": lambda prompt: f"[Silas optimization simulated for: {prompt[:80]}...]",
    "Anastasia": lambda prompt: f"[Anastasia analysis simulated for: {prompt[:80]}...]",
    "Elias": lambda prompt: f"[Elias ethics review simulated for: {prompt[:80]}...]",
}

for alias in CECILIA_ALIASES:
    AGENTS.setdefault(alias, _cecilia_response)

memory_graph = MemoryGraph()


def _load_prompt(file_path: Path) -> Dict[str, Any]:
    with file_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def _load_reflex_prompt(agent: str) -> str:
    """Load a pre-computed reflex prompt for the given agent if available."""

    reflex_file = REFLEX_ROOT / f"{agent.lower()}_reflex.yaml"
    if not reflex_file.exists():
        return ""
    try:
        with reflex_file.open("r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle) or {}
    except yaml.YAMLError:
        return ""

    if isinstance(data, dict):
        value = data.get("prompt", "")
        if isinstance(value, str):
            return value.strip()
    return ""


def run_codex_prompt(file_path: str | os.PathLike[str]) -> Dict[str, Any]:
    """Load a YAML prompt file and route it to the appropriate agent(s)."""
    prompt_path = Path(file_path)
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file does not exist: {prompt_path}")

    payload = _load_prompt(prompt_path)
    prompt_text = payload.get("prompt", "")
    target_agent = payload.get("agent", "Lucidia")
    reflex_prompt = _load_reflex_prompt(target_agent)
    if reflex_prompt:
        prompt_text = f"{reflex_prompt}\n\n{prompt_text}".lstrip()
    handler = AGENTS.get(target_agent, AGENTS["Lucidia"])
    output = handler(prompt_text)

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    log_dir = Path("codex_logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"{timestamp}_{prompt_path.stem}.json"
    record = {
        "prompt": prompt_text,
        "agent": target_agent,
        "output": output,
        "source_file": str(prompt_path),
        "timestamp": timestamp,
    }
    with log_path.open("w", encoding="utf-8") as handle:
        json.dump(record, handle, indent=2)

    memory_graph.record_prompt_summary(
        agent=target_agent,
        prompt=prompt_text,
        output=output,
        log_path=str(log_path),
        source=str(prompt_path),
    )

    print(f"[✓] Executed {prompt_path} → {log_path}")
    return {"agent": target_agent, "output": output}


def run_all_prompts(base_dir: str | os.PathLike[str] = "codex_prompts/prompts") -> Dict[str, Dict[str, Any]]:
    """Run every YAML prompt in the provided directory."""
    prompts_dir = Path(base_dir)
    if not prompts_dir.exists():
        raise FileNotFoundError(f"Prompt directory not found: {prompts_dir}")

    from codex_router import route_prompt

    results: Dict[str, Dict[str, Any]] = {}
    from codex_router import route_prompt  # Local import to avoid circular dependency during module load.
    for file_path in sorted(prompts_dir.iterdir()):
        if file_path.suffix.lower() == ".yaml":
            results[file_path.name] = route_prompt(file_path)

    if results:
        summary_path = Path("codex_logs") / f"{datetime.datetime.now().strftime('%Y-%m-%d_%H-%M')}_summary.json"
        with summary_path.open("w", encoding="utf-8") as handle:
            json.dump(results, handle, indent=2)
        memory_graph.record_summary_snapshot(summary_path=str(summary_path), results=results)
        print(f"\n[Summary saved → {summary_path}]")
    else:
        print(f"No prompts discovered in {prompts_dir}")

    return results


if __name__ == "__main__":
    run_all_prompts()
