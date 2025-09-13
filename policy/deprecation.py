"""Deprecation registry and linter."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[1]

_DEPRECATED: Dict[str, Dict[str, str]] = {
    "SRE-BOT.v1": {
        "replacement": "SRE-BOT.v2",
        "deadline": "2099-01-01",
    }
}


def registry() -> Dict[str, Dict[str, str]]:
    return _DEPRECATED


def lint_repo() -> List[str]:
    issues: List[str] = []
    bots_dir = ROOT / "bots"
    for path in bots_dir.glob("*.py"):
        text = path.read_text()
        for item in _DEPRECATED:
            bot, intent = item.split(".")
            if bot in text and intent in text:
                issues.append(f"{path.name} uses deprecated {item}")
    return issues
