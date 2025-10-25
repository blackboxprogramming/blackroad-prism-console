"""Utility helpers to publish spawned agents to Hugging Face Spaces."""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

LOGGER = logging.getLogger(__name__)
LOGGER.addHandler(logging.NullHandler())

DEFAULT_NAMESPACE = os.getenv("HF_NAMESPACE", "blackroad-agents")
LOCAL_EXPORT_DIR = Path(os.getenv("HF_LOCAL_EXPORT", "registry/huggingface"))


@dataclass(slots=True)
class PublishResult:
    """Represents the outcome of a Hugging Face publish attempt."""

    repo_id: str
    url: str
    pushed: bool


MODEL_CARD_TEMPLATE = """---
title: "{name}"
base_model: "{base_model}"
lineage: "{parent_agent}"
tags:
  - agent
  - blackroad
---

# {name}

- **Domain:** {domain}
- **Description:** {description}
- **Base model:** {base_model}
- **Parent agent:** {parent_agent}
- **Status:** {status}

This model card was generated automatically by the BlackRoad Prism Console.
"""


def _render_model_card(agent: Dict[str, str]) -> str:
    parent = agent.get("parent_agent") or "none"
    return MODEL_CARD_TEMPLATE.format(
        name=agent.get("name", "Unnamed Agent"),
        base_model=agent.get("base_model", "unknown"),
        domain=agent.get("domain", "unspecified"),
        description=agent.get("description", ""),
        parent_agent=parent,
        status=agent.get("status", "pending"),
    )


def _ensure_local_repo(repo_id: str, card_text: str, agent: Dict[str, str]) -> Path:
    LOCAL_EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    slug = repo_id.replace("/", "--")
    repo_dir = LOCAL_EXPORT_DIR / slug
    repo_dir.mkdir(parents=True, exist_ok=True)
    (repo_dir / "README.md").write_text(card_text, encoding="utf-8")
    (repo_dir / "agent.json").write_text(json.dumps(agent, indent=2), encoding="utf-8")
    return repo_dir


def publish_to_huggingface(agent: Dict[str, str], *, namespace: Optional[str] = None) -> PublishResult:
    """Publish ``agent`` metadata to Hugging Face.

    The function attempts to use :mod:`huggingface_hub`. When the SDK or
    authentication token is unavailable it falls back to exporting the
    metadata locally so the automation pipeline can inspect it later.
    """

    namespace = namespace or DEFAULT_NAMESPACE
    slug = agent.get("slug") or agent["name"].lower().replace(" ", "-")
    repo_id = f"{namespace}/{slug}"
    url = f"https://huggingface.co/spaces/{repo_id}"
    card_text = _render_model_card(agent)
    pushed = False

    token = os.getenv("HF_TOKEN")

    try:  # pragma: no cover - network dependent
        from huggingface_hub import HfApi, HfFolder  # type: ignore

        if not token:
            token = HfFolder.get_token()
        if not token:
            raise RuntimeError("Missing Hugging Face token")
        api = HfApi(token=token)
        private = os.getenv("HF_PRIVATE", "false").lower() in {"1", "true", "yes"}
        api.create_repo(repo_id, repo_type="space", exist_ok=True, private=private)
        api.upload_file(
            path_or_fileobj=card_text.encode("utf-8"),
            path_in_repo="README.md",
            repo_id=repo_id,
            repo_type="space",
        )
        api.upload_file(
            path_or_fileobj=json.dumps(agent, indent=2).encode("utf-8"),
            path_in_repo="agent.json",
            repo_id=repo_id,
            repo_type="space",
        )
        pushed = True
        LOGGER.info("Published agent %s to Hugging Face (%s)", agent.get("name"), repo_id)
    except Exception as exc:  # pragma: no cover - defensive logging
        LOGGER.warning("Hugging Face publish fallback for %s: %s", repo_id, exc)
        _ensure_local_repo(repo_id, card_text, agent)

    if pushed:
        _ensure_local_repo(repo_id, card_text, agent)

    return PublishResult(repo_id=repo_id, url=url, pushed=pushed)


__all__ = ["publish_to_huggingface", "PublishResult", "DEFAULT_NAMESPACE"]
