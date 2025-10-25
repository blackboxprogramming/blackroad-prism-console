"""Render Storyteller artifacts from structured episode data."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict
import json
import textwrap

from .persona_style import get_tone


@dataclass
class Episode:
    """Minimal representation of an episode ready for rendering."""

    episode_id: str
    title: str
    audience: str
    lessons: list[str]
    next_door: str


TEMPLATE_HEADER = """# {title}\n\n> Episode ID: {episode_id}\n> Audience: {audience_title}\n"""


def render_markdown(episode: Episode) -> str:
    """Render a simple markdown representation for Storyteller."""

    tone = get_tone(episode.audience)
    lesson_block = "\n".join(f"- {lesson}" for lesson in episode.lessons)
    body = textwrap.dedent(
        f"""
        ## {tone.headline}
        {tone.cadence}

        ### Lessons
        {lesson_block}

        ### Next Door
        {episode.next_door}
        """
    ).strip()
    return TEMPLATE_HEADER.format(
        title=episode.title,
        episode_id=episode.episode_id,
        audience_title=episode.audience,
    ) + "\n\n" + body + "\n"


def render_from_pr(pr_event: Dict[str, Any]) -> Path:
    """Render an episode stub from a merged PR event."""

    output_dir = Path(pr_event.get("output_dir", "codex_episodes"))
    output_dir.mkdir(parents=True, exist_ok=True)
    episode = Episode(
        episode_id=pr_event["episode_id"],
        title=pr_event["title"],
        audience=pr_event.get("audience", "engineers"),
        lessons=pr_event.get("lessons", ["Document the change." ]),
        next_door=pr_event.get("next_door", "TBD"),
    )
    markdown = render_markdown(episode)
    output_path = output_dir / f"{episode.episode_id}.md"
    output_path.write_text(markdown, encoding="utf-8")
    metadata_path = output_dir / f"{episode.episode_id}.json"
    metadata_path.write_text(json.dumps(pr_event, indent=2), encoding="utf-8")
    return output_path
