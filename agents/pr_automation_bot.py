"""Auto-fill pull request context using branch metadata.

This script runs in CI to keep the PR template's Context section
up-to-date. It looks at the head branch of the pull request, finds a
matching summary in our branch catalog CSVs, and then injects a
``- Context: ...`` line near the top of the Context section.

If no direct match is found, it gracefully falls back to a title-cased
interpretation of the branch name so reviewers still receive a helpful
hint. Pull requests that already contain a context line are left
untouched unless the text differs from the freshly derived context.
"""

from __future__ import annotations

import csv
import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, Mapping, Optional

import requests

ContextMap = Dict[str, str]


@dataclass
class PRAutomationBot:
    """Populate pull request context derived from branch naming."""

    repo: str
    token: Optional[str] = None
    _context_map: ContextMap = field(init=False, default_factory=dict)

    def run(self, branch: str, pr_number: int, pr_body: str, pr_title: str = "") -> bool:
        """Update the PR body with a context line when needed."""

        if not branch:
            return False

        normalized_branch = self._normalize_branch(branch)
        context = self._derive_context(normalized_branch)
        if not context and pr_title:
            context = pr_title.strip()
        if not context:
            context = self._format_branch_summary(normalized_branch)
        if not context:
            return False

        updated_body = self._ensure_context_line(pr_body or "", context)
        if updated_body == pr_body:
            return False

        self._update_pull_request(pr_number, updated_body)
        return True

    # ------------------------------------------------------------------
    # Context derivation helpers
    # ------------------------------------------------------------------
    def _derive_context(self, branch: str) -> str:
        mapping = self._load_context_map()
        return mapping.get(branch, "")

    def _load_context_map(self) -> ContextMap:
        if self._context_map:
            return self._context_map

        repo_root = Path(__file__).resolve().parents[1]
        candidates = [
            repo_root / "prs-200.csv",
            repo_root / "prs.csv",
        ]

        mapping: ContextMap = {}
        for csv_path in candidates:
            if not csv_path.exists():
                continue
            mapping.update(self._read_context_file(csv_path))

        self._context_map = mapping
        return mapping

    def _read_context_file(self, path: Path) -> ContextMap:
        mapping: ContextMap = {}
        with path.open(newline="", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames:
                return mapping

            branch_field = self._detect_branch_field(reader.fieldnames)
            context_field = self._detect_context_field(reader.fieldnames)
            if not branch_field or not context_field:
                return mapping

            for row in reader:
                branch_name = (row.get(branch_field) or "").strip()
                context_text = (row.get(context_field) or "").strip()
                if not branch_name or not context_text:
                    continue
                normalized = self._normalize_branch(branch_name)
                mapping.setdefault(normalized, context_text)
        return mapping

    @staticmethod
    def _detect_branch_field(fieldnames: Iterable[str]) -> Optional[str]:
        for candidate in ("branch", "head_branch"):
            if candidate in fieldnames:
                return candidate
        return None

    @staticmethod
    def _detect_context_field(fieldnames: Iterable[str]) -> Optional[str]:
        for candidate in ("summary", "body", "title"):
            if candidate in fieldnames:
                return candidate
        return None

    @staticmethod
    def _normalize_branch(branch: str) -> str:
        branch = branch.strip()
        if branch.startswith("refs/heads/"):
            branch = branch[len("refs/heads/"):]
        return branch

    @staticmethod
    def _format_branch_summary(branch: str) -> str:
        if not branch:
            return ""
        parts = [segment for segment in branch.split("/") if segment]
        if not parts:
            return ""
        last_segment = parts[-1].replace("-", " ").strip()
        if not last_segment:
            last_segment = parts[-1]
        summary = " ".join(word.capitalize() for word in last_segment.split())
        if not summary:
            summary = branch
        return f"{summary} ({branch})"

    # ------------------------------------------------------------------
    # PR body manipulation
    # ------------------------------------------------------------------
    def _ensure_context_line(self, body: str, context: str) -> str:
        marker = "### Context"
        if marker not in body:
            return body

        section_start = body.index(marker) + len(marker)
        section_tail = body[section_start:]
        next_header_index = section_tail.find("\n### ")
        if next_header_index == -1:
            section_body = section_tail
            remainder = ""
        else:
            section_body = section_tail[:next_header_index]
            remainder = section_tail[next_header_index:]

        updated_section = self._insert_context_line(section_body, context)
        if updated_section == section_body:
            return body

        return body[:section_start] + updated_section + remainder

    def _insert_context_line(self, section: str, context: str) -> str:
        lines = section.splitlines(keepends=True)
        newline = "\n"
        for line in lines:
            if line.endswith("\r\n"):
                newline = "\r\n"
                break

        formatted = f"- Context: {context}{newline}"
        new_lines: list[str] = []
        inserted = False

        for line in lines:
            stripped = line.strip()
            if stripped.lower().startswith("- context:"):
                if not inserted:
                    new_lines.append(formatted)
                    inserted = True
                continue
            new_lines.append(line)

        if not inserted:
            insert_at = 0
            while insert_at < len(new_lines) and new_lines[insert_at].strip() == "":
                insert_at += 1
            new_lines.insert(insert_at, formatted)
            inserted = True

        if not new_lines:
            new_lines.append(formatted)

        updated = "".join(new_lines)
        if section.endswith(newline) and not updated.endswith(newline):
            updated += newline
        return updated

    # ------------------------------------------------------------------
    # GitHub API interaction
    # ------------------------------------------------------------------
    def _update_pull_request(self, pr_number: int, body: str) -> None:
        url = f"https://api.github.com/repos/{self.repo}/pulls/{pr_number}"
        headers = {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        response = requests.patch(url, headers=headers, json={"body": body}, timeout=10)
        response.raise_for_status()


def main() -> int:
    repo = os.getenv("GITHUB_REPO")
    event_path = os.getenv("GITHUB_EVENT_PATH")
    branch = os.getenv("PR_BRANCH", "")
    token = os.getenv("GITHUB_TOKEN")

    if not repo or not event_path:
        print("PR automation bot missing required environment: GITHUB_REPO or GITHUB_EVENT_PATH.")
        return 1

    event_file = Path(event_path)
    if not event_file.exists():
        print(f"GitHub event payload not found at {event_file}.")
        return 1

    with event_file.open(encoding="utf-8") as handle:
        payload = json.load(handle)

    pr_data: Mapping[str, object] = payload.get("pull_request") or {}
    if not pr_data:
        print("No pull request data found in event payload; skipping context auto-fill.")
        return 0

    pr_number = int(pr_data.get("number"))
    pr_body = str(pr_data.get("body") or "")
    pr_title = str(pr_data.get("title") or "")
    if not branch:
        head = pr_data.get("head") or {}
        branch = str(head.get("ref") or "")

    bot = PRAutomationBot(repo=repo, token=token)
    if bot.run(branch=branch, pr_number=pr_number, pr_body=pr_body, pr_title=pr_title):
        print(f"Context auto-fill applied for PR #{pr_number} ({branch}).")
    else:
        print("Context auto-fill skipped; no changes needed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
