"""Generate lightweight work instructions for unit tests.

The goal is to create predictable Markdown and HTML outputs so the
pytest suite can assert on their presence.  The implementation deliberately
avoids coupling to the wider manufacturing modules.
"""

from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, Optional

ART_DIR: Path = Path("artifacts/mfg/wi")


def _ensure_art_dir() -> Path:
    path = Path(ART_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _format_steps(steps: Iterable[str]) -> str:
    lines = []
    for index, step in enumerate(steps, 1):
        lines.append(f"{index}. {step}")
    return "\n".join(lines) if lines else "1. Assemble per routing"


def render(item: str, rev: str, routing: Optional[Dict[str, object]] = None) -> Path:
    """Render Markdown and HTML work instructions for ``item``/``rev``."""

    art_dir = _ensure_art_dir()
    key = f"{item}_{rev}"

    routing_steps = []
    if routing and isinstance(routing.get("steps"), list):
        for step in routing["steps"]:
            if isinstance(step, dict):
                label = step.get("op") or step.get("description") or "Unnamed step"
                wc = step.get("wc")
                if wc:
                    label = f"{label} @ {wc}"
                routing_steps.append(str(label))
            else:
                routing_steps.append(str(step))

    timestamp = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    summary_lines = [
        f"# Work Instructions — {item} rev {rev}",
        "",
        f"Generated: {timestamp}",
        "",
        "## Steps",
        _format_steps(routing_steps),
    ]
    markdown = "\n".join(summary_lines) + "\n"

    md_path = art_dir / f"{key}.md"
    html_path = art_dir / f"{key}.html"
    md_path.write_text(markdown, encoding="utf-8")
    html_path.write_text(f"<html><body><pre>{markdown}</pre></body></html>", encoding="utf-8")
    return md_path


def cli_wi_render(argv: Optional[list[str]] = None) -> Path:
    parser = argparse.ArgumentParser(prog="mfg:wi:render", description="Render work instructions")
    parser.add_argument("--item", required=True)
    parser.add_argument("--rev", required=True)
    args = parser.parse_args(argv)
    return render(args.item, args.rev)


__all__ = ["render", "cli_wi_render", "ART_DIR"]
