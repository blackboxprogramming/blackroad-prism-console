"""Render Storyteller artifacts from structured episode data."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List
import json
import textwrap
from datetime import datetime

from .persona_style import get_tone


@dataclass
class Episode:
    """Minimal representation of an episode ready for rendering."""

    episode_id: str
    title: str
    audience: str
    lessons: list[str]
    next_door: str
    citations: list[str]
    a_b_tests: list[dict[str, str]]


TEMPLATE_HEADER = """# {title}\n\n> Episode ID: {episode_id}\n> Audience: {audience_title}\n"""

DATASETS_DIR = Path(__file__).resolve().parent.parent / "datasets"
CANON_TIMELINE_PATH = DATASETS_DIR / "canon_timeline.json"


def render_markdown(episode: Episode) -> str:
    """Render a simple markdown representation for Storyteller."""

    tone = get_tone(episode.audience)
    lesson_block = "\n".join(f"- {lesson}" for lesson in episode.lessons)
    citations_block = "\n".join(f"- {cite}" for cite in episode.citations)
    if episode.a_b_tests:
        experiments_block = "\n".join(
            f"- {test.get('hypothesis', 'Hypothesis')} → {test.get('result', 'Result')}"
            for test in episode.a_b_tests
        )
    else:
        experiments_block = "_No experiments logged this time. Add one?_"
    body = textwrap.dedent(
        f"""
        ## {tone.headline}
        {tone.cadence}

        ### Lessons
        {lesson_block}

        ### Citations
        {citations_block}

        ### Experiments
        {experiments_block}

        ### Next Door
        {episode.next_door}
        """
    ).strip()
    return TEMPLATE_HEADER.format(
        title=episode.title,
        episode_id=episode.episode_id,
        audience_title=episode.audience,
    ) + "\n\n" + body + "\n"


def _load_json_list(path: Path) -> List[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
    except json.JSONDecodeError:
        pass
    return []


def _write_json(path: Path, data: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(list(data), indent=2), encoding="utf-8")


def _update_canon_timeline(entry: Dict[str, Any], path: Path = CANON_TIMELINE_PATH) -> None:
    timeline = _load_json_list(path)
    filtered = [item for item in timeline if item.get("episode_id") != entry.get("episode_id")]
    filtered.append(entry)

    def sort_key(item: dict[str, Any]) -> tuple[str, str]:
        date_str = str(item.get("date", ""))
        try:
            dt = datetime.fromisoformat(date_str)
            return (dt.isoformat(), item.get("episode_id", ""))
        except ValueError:
            return (date_str, item.get("episode_id", ""))

    filtered.sort(key=sort_key)
    _write_json(path, filtered)


def render_from_pr(pr_event: Dict[str, Any]) -> Path:
    """Render an episode stub from a merged PR event."""

    output_dir = Path(pr_event.get("output_dir", "codex_episodes"))
    output_dir.mkdir(parents=True, exist_ok=True)
    citations = pr_event.get("citations") or [
        pr_event.get("url")
        or f"PR #{pr_event.get('number', 'unknown')}"
        or "Citation pending"
    ]
    episode_tests = [test for test in pr_event.get("a_b_tests", []) if isinstance(test, dict)]
    episode = Episode(
        episode_id=pr_event["episode_id"],
        title=pr_event["title"],
        audience=pr_event.get("audience", "engineers"),
        lessons=pr_event.get("lessons", ["Document the change." ]),
        next_door=pr_event.get("next_door", "TBD"),
        citations=[str(cite) for cite in citations if cite],
        a_b_tests=episode_tests,
    )
    markdown = render_markdown(episode)
    output_path = output_dir / f"{episode.episode_id}.md"
    output_path.write_text(markdown, encoding="utf-8")
    metadata_path = output_dir / f"{episode.episode_id}.json"
    metadata_path.write_text(json.dumps(pr_event, indent=2), encoding="utf-8")
    _update_canon_timeline(
        {
            "date": pr_event.get("merged_at", ""),
            "episode_id": episode.episode_id,
            "title": episode.title,
            "summary": pr_event.get("summary", ""),
            "next_door": episode.next_door,
        }
    )
    return output_path
