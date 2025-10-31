"""Transform repository events into lesson cards.

The helpers in this module do not rely on heavy frameworks so they can run in
CI or lightweight reflex hooks. Validation focuses on the fields required by
``schemas/lesson_card.schema.json``. If optional dependencies such as
``jsonschema`` are available they are used, otherwise a conservative manual
check runs.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

try:  # Optional; keeps import cheap if jsonschema is not installed.
    import jsonschema
except Exception:  # pragma: no cover - handled by fallback validator.
    jsonschema = None  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
LESSON_SCHEMA = ROOT / "schemas" / "lesson_card.schema.json"
DEFAULT_OUTPUT = ROOT / "curriculum" / "lessons"

ID_PATTERN = re.compile(r"^L-[A-Z0-9\-]+$")


@dataclass
class LessonContext:
    """Minimal metadata used to build lesson cards."""

    source: str
    repo: str
    branch: str
    lines_changed: int
    url: Optional[str] = None


def load_schema(path: Path = LESSON_SCHEMA) -> Dict[str, Any]:
    """Return the JSON schema for lesson cards."""

    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _manual_validate(card: Dict[str, Any]) -> None:
    required = {"id", "title", "audience", "level", "context_links", "goals", "steps", "exit_ticket"}
    missing = sorted(required - card.keys())
    if missing:
        raise ValueError(f"Lesson card missing required fields: {', '.join(missing)}")
    if not ID_PATTERN.match(card["id"]):
        raise ValueError(f"Invalid lesson id format: {card['id']}")
    if not isinstance(card["context_links"], list) or not card["context_links"]:
        raise ValueError("context_links must include at least one entry")
    if not isinstance(card["steps"], list) or not card["steps"]:
        raise ValueError("steps must include at least one entry")


def validate_card(card: Dict[str, Any], schema: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Validate a lesson card using the bundled schema if possible."""

    if jsonschema is not None:
        if schema is None:
            schema = load_schema()
        jsonschema.validate(card, schema)  # type: ignore[arg-type]
        return card

    _manual_validate(card)
    return card


def sanitize_slug(text: str) -> str:
    """Create a slug suitable for file names."""

    return re.sub(r"[^a-z0-9-]", "-", text.lower()).strip("-")


def card_filename(card: Dict[str, Any]) -> str:
    """Return the base filename for a card without extension."""

    slug = sanitize_slug(card["title"])
    return f"{card['id'].lower()}-{slug}"


def card_to_markdown(card: Dict[str, Any]) -> str:
    """Render a lightweight markdown view of a card."""

    lines = [f"# {card['title']}", "", f"Audience: **{card['audience']}**", f"Level: **{card['level']}**", ""]
    lines.append("## Goals")
    for goal in card["goals"]:
        lines.append(f"- {goal}")
    lines.append("")
    lines.append("## Steps")
    for step in card["steps"]:
        detail = step.get("content", "")
        lines.append(f"- **{step['type']}** — {detail}")
        if step.get("command"):
            lines.append(f"  - Command: `{step['command']}`")
        if step.get("snippet"):
            lines.append(f"  - Snippet: `{step['snippet']}`")
    if card.get("hints"):
        lines.append("")
        lines.append("## Hints")
        for hint in card["hints"]:
            lines.append(f"- {hint}")
    lines.append("")
    lines.append("## Exit Ticket")
    lines.append(card["exit_ticket"])
    return "\n".join(lines)


def save_card(card: Dict[str, Any], directory: Path = DEFAULT_OUTPUT) -> Path:
    """Persist the lesson card as JSON and markdown."""

    directory.mkdir(parents=True, exist_ok=True)
    base = directory / card_filename(card)
    json_path = base.with_suffix(".json")
    md_path = base.with_suffix(".md")

    with json_path.open("w", encoding="utf-8") as handle:
        json.dump(card, handle, indent=2, sort_keys=True)
    with md_path.open("w", encoding="utf-8") as handle:
        handle.write(card_to_markdown(card))
    return json_path


def pr_to_lesson_cards(event: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Create lesson cards from a pull request merge event."""

    context = LessonContext(
        source=event.get("id", "unknown"),
        repo=event.get("repo", "unknown"),
        branch=event.get("target_branch", "main"),
        lines_changed=int(event.get("lines_changed", 0)),
        url=event.get("url"),
    )

    title = event.get("title", "PR Lesson")
    card_id = f"L-PR-{context.source or 'NA'}"
    context_link = context.url or event.get("html_url") or "./"
    energy_hint = "Aim < 1.5J per validation run" if context.lines_changed < 120 else "Budget 2J for review and tests"

    card = {
        "id": card_id,
        "title": title,
        "audience": "builders",
        "level": "intro" if context.lines_changed < 200 else "intermediate",
        "context_links": [context_link],
        "goals": [
            "Summarize the merged change for a learner",
            "Identify one safety gate impacted",
            "Schedule a retrieval practice touch point",
        ],
        "energy_hint": energy_hint,
        "steps": [
            {
                "type": "read",
                "content": event.get("summary", "Review the PR description for context."),
            },
            {
                "type": "code",
                "content": "Highlight the most instructive diff chunk.",
                "snippet": event.get("highlight", ""),
            },
            {
                "type": "check",
                "content": "Run the agreed verification command.",
                "command": event.get("check_command", "pytest"),
            },
        ],
        "hints": [
            "Start by naming the event this change should emit.",
            "Describe how learners will know the change is safe.",
        ],
        "exit_ticket": "Explain how this PR becomes a reusable lesson for the next builder.",
    }

    validate_card(card)
    return [card]


def write_cards(cards: Iterable[Dict[str, Any]], directory: Path = DEFAULT_OUTPUT) -> List[Path]:
    """Persist a sequence of cards."""

    paths: List[Path] = []
    for card in cards:
        validate_card(card)
        paths.append(save_card(card, directory))
    return paths


__all__ = [
    "LessonContext",
    "card_filename",
    "card_to_markdown",
    "load_schema",
    "pr_to_lesson_cards",
    "save_card",
    "validate_card",
    "write_cards",
]
