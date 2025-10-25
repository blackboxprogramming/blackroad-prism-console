"""Bridge utilities for requesting Codex tasks from Lucidia MathLab agents."""

from __future__ import annotations

from pathlib import Path

from codex_router import route_prompt


def request_codex_task(agent: str, topic: str, details: str) -> str:
    """Persist a temporary prompt file, execute it, and return the Codex response."""
    prompt = f"{topic}\n\n{details}"
    prompts_dir = Path("codex_prompts/prompts")
    prompts_dir.mkdir(parents=True, exist_ok=True)

    safe_topic = topic.replace(" ", "_").replace("/", "-")
    temp_file = prompts_dir / f"tmp_{agent}_{safe_topic}.yaml"

    indented_prompt = "\n".join(f"  {line}" for line in prompt.splitlines())
    with temp_file.open("w", encoding="utf-8") as handle:
        handle.write(f"agent: {agent}\nprompt: |\n{indented_prompt}\n")

    result = route_prompt(temp_file)
    temp_file.unlink(missing_ok=True)
    return result["output"]

