#
"""Local PR bots used for offline evaluation."""
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class BotResult:
    name: str
    vote: str  # "approve" or "request_changes"
    details: str


class SizeBot:
    name = "Size-BOT"

    def run(self, spec: dict) -> BotResult:
        lines = spec.get("lines_changed", 0)
        label = "big" if lines > 200 else "small"
        return BotResult(self.name, "approve", label)


class ChangelogBot:
    name = "Changelog-BOT"

    def run(self, spec: dict) -> BotResult:
        files = spec.get("changed_files", [])
        ok = any(f.endswith("CHANGELOG.md") for f in files)
        vote = "approve" if ok else "request_changes"
        details = "changelog" if ok else "missing"
        return BotResult(self.name, vote, details)


class DocsBot:
    name = "Docs-BOT"

    def run(self, spec: dict) -> BotResult:
        files = spec.get("changed_files", [])
        ok = any(f.startswith("docs/") for f in files)
        vote = "approve" if ok else "request_changes"
        details = "docs" if ok else "missing"
        return BotResult(self.name, vote, details)


class TestsBot:
    name = "Tests-BOT"

    def run(self, spec: dict) -> BotResult:
        files = spec.get("changed_files", [])
        ok = any(f.startswith("tests/") for f in files)
        vote = "approve" if ok else "request_changes"
        details = "tests" if ok else "missing"
        return BotResult(self.name, vote, details)


def available_bots() -> List:
    return [SizeBot(), ChangelogBot(), DocsBot(), TestsBot()]
