"""Shared helpers for GitHub Action bot workflows."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, Tuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from orchestrator.protocols import Response, Task

LOGGER = logging.getLogger(__name__)


def _load_event() -> Dict[str, Any]:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        raise RuntimeError("GITHUB_EVENT_PATH is not set")
    with open(event_path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _build_task(pr_payload: Dict[str, Any]) -> Task:
    description = pr_payload.get("title") or pr_payload.get("body") or ""
    return Task(
        id=str(pr_payload.get("number")),
        description=description,
        goal=pr_payload.get("title"),
        context={
            "body": pr_payload.get("body") or "",
            "labels": [label.get("name") for label in pr_payload.get("labels", [])],
            "head_sha": pr_payload.get("head", {}).get("sha"),
            "base_ref": pr_payload.get("base", {}).get("ref"),
            "url": pr_payload.get("html_url"),
        },
        created_at=datetime.now(timezone.utc),
    )


def _format_comment(bot_name: str, status: str, response_data: Dict[str, Any], maintainers: Iterable[str]) -> str:
    lines = [f"## {bot_name} Automation Report", f"**Status:** `{status}`"]
    summary = response_data.get("summary")
    if isinstance(summary, str) and summary.strip():
        lines.append(f"**Summary:** {summary.strip()}")
    lines.append("")
    lines.append("<details><summary>Full bot payload</summary>")
    lines.append("")
    lines.append("```json")
    lines.append(json.dumps(response_data, indent=2, sort_keys=True))
    lines.append("```")
    lines.append("</details>")
    maintainers_list = [m for m in maintainers if m]
    if maintainers_list:
        lines.append("")
        lines.append("cc " + " ".join(sorted(set(maintainers_list))))
    return "\n".join(lines)


def _append_log(bot_name: str, payload: Dict[str, Any]) -> None:
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"{bot_name}.jsonl"
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, sort_keys=True) + "\n")


def _post_comment(comments_url: str, body: str) -> Tuple[int, str]:
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        LOGGER.warning("GITHUB_TOKEN not available; skipping comment post")
        return 0, "token-missing"
    request = Request(
        comments_url,
        data=json.dumps({"body": body}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "blackroad-prism-bot-runner",
        },
        method="POST",
    )
    try:
        with urlopen(request) as response:
            return response.getcode(), response.read().decode("utf-8")
    except HTTPError as exc:  # pragma: no cover - network branch
        LOGGER.error("GitHub API error: %s", exc.read().decode("utf-8"))
        return exc.code, "http-error"
    except URLError as exc:  # pragma: no cover - network branch
        LOGGER.error("GitHub API connection error: %s", exc.reason)
        return -1, "network-error"


def execute_bot_workflow(
    *,
    bot_name: str,
    bot_factory: Callable[[], Any],
    maintainers: Iterable[str],
) -> None:
    """Execute a bot against the current GitHub event payload."""

    event = _load_event()
    pr_payload = event.get("pull_request")
    if not pr_payload:
        raise RuntimeError("Bot workflows require a pull_request event payload")

    task = _build_task(pr_payload)
    bot_instance = bot_factory()
    response = bot_instance.run(task)

    if isinstance(response, Response):
        status = response.status
        response_data = response.data
        task_id = response.task_id
    elif hasattr(response, "dict"):
        response_dict = response.dict()  # type: ignore[assignment]
        status = response_dict.get("status", "unknown")
        response_data = response_dict.get("data", {})
        task_id = response_dict.get("task_id", task.id)
    else:
        status = getattr(response, "status", "unknown")
        response_data = getattr(response, "data", {})
        task_id = getattr(response, "task_id", task.id)

    log_payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "bot": bot_name,
        "task_id": task_id,
        "status": status,
        "repository": event.get("repository", {}).get("full_name"),
        "pull_request": {
            "number": pr_payload.get("number"),
            "title": pr_payload.get("title"),
            "labels": [label.get("name") for label in pr_payload.get("labels", [])],
            "url": pr_payload.get("html_url"),
        },
        "response": response_data,
    }
    _append_log(bot_name, log_payload)

    comment_body = _format_comment(bot_name, status, response_data, maintainers)
    comments_url = pr_payload.get("comments_url")
    if comments_url:
        _post_comment(comments_url, comment_body)
    else:
        LOGGER.warning("No comments_url in pull request payload; skipping comment")
