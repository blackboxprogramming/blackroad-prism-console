#!/usr/bin/env python3
"""Create a lightweight hello task in Asana."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

ASANA_TASKS_URL = "https://app.asana.com/api/1.0/tasks"


def build_headers(token: str) -> dict[str, str]:
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def post_hello_task(message: str, project_id: str, token: str) -> None:
    payload = {
        "data": {
            "name": message,
            "notes": "Automated hello from the agents queue.",
            "projects": [project_id],
        }
    }
    data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        ASANA_TASKS_URL,
        data=data,
        headers=build_headers(token),
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            if response.status >= 400:
                raise RuntimeError(f"Asana API returned status {response.status}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore") if exc.fp else ""
        raise RuntimeError(
            f"Asana API returned status {exc.code}: {detail}".strip()
        ) from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Asana request failed: {exc.reason}") from exc


def main() -> None:
    token = os.getenv("ASANA_PAT") or os.getenv("ASANA_TOKEN")
    if not token:
        raise RuntimeError("ASANA_PAT or ASANA_TOKEN must be set")

    project_id = (
        os.getenv("ASANA_PROJECT_ID")
        or os.getenv("ASANA_HELLO_PROJECT_ID")
        or ""
    )
    if not project_id:
        raise RuntimeError("ASANA_PROJECT_ID (or ASANA_HELLO_PROJECT_ID) must be set")

    message = os.getenv("ASANA_HELLO_MESSAGE", "hellooooo!")
    post_hello_task(message, project_id, token)
    print("created asana hello task")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover - entrypoint error reporting
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)
