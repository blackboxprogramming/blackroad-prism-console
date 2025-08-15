#!/usr/bin/env python3
"""Minimal issue opener for GitHub, GitLab, and Bitbucket."""

import json
import os
import urllib.request
import urllib.parse
from typing import Optional


def open_issue(provider: str, repo: str, title: str, body: str,
               token: Optional[str] = None, token_env: Optional[str] = None,
               api_base: Optional[str] = None):
    """Open an issue on the given provider.

    Parameters
    ----------
    provider: str
        One of ``github``, ``gitlab``, or ``bitbucket``.
    repo: str
        Repository identifier. For GitHub and Bitbucket this is ``owner/repo``;
        for GitLab it is the project path (``group/project``).
    title: str
        Issue title.
    body: str
        Issue body/description.
    token: str, optional
        API token. If not provided, ``token_env`` will be consulted.
    token_env: str, optional
        Name of environment variable holding the API token.
    api_base: str, optional
        Override API base URL.
    """
    provider = (provider or "").lower()
    token = token or (token_env and os.getenv(token_env))
    if not token:
        raise ValueError("API token is required to open an issue")

    if provider == "github":
        api_base = api_base or "https://api.github.com"
        url = f"{api_base}/repos/{repo}/issues"
        headers = {"Authorization": f"token {token}"}
        payload = {"title": title, "body": body}
    elif provider == "gitlab":
        api_base = api_base or "https://gitlab.com/api/v4"
        project = urllib.parse.quote_plus(repo)
        url = f"{api_base}/projects/{project}/issues"
        headers = {"PRIVATE-TOKEN": token}
        payload = {"title": title, "description": body}
    elif provider == "bitbucket":
        api_base = api_base or "https://api.bitbucket.org/2.0"
        url = f"{api_base}/repositories/{repo}/issues"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"title": title, "content": {"raw": body}}
    else:
        raise ValueError(f"Unknown issue provider: {provider}")

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={**headers, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        resp.read()
    return url

__all__ = ["open_issue"]
