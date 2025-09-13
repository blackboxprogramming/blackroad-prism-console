#
"""Commit message linter enforcing conventional commits."""
import re
import subprocess
from pathlib import Path
from typing import List, Optional

PATTERN = re.compile(r"^(feat|fix|docs|refactor|test|chore): .+")


def _git_messages(since: str) -> List[str]:
    res = subprocess.run(["git", "log", f"{since}..HEAD", "--pretty=%s"], capture_output=True, text=True)
    return [line.strip() for line in res.stdout.splitlines() if line.strip()]


def _file_messages(path: Path) -> List[str]:
    return [line.strip() for line in path.read_text().splitlines() if line.strip()]


def lint(since: Optional[str] = None, log_file: Optional[Path] = None) -> List[str]:
    if log_file:
        msgs = _file_messages(log_file)
    elif since:
        msgs = _git_messages(since)
    else:
        msgs = []
    bad = [m for m in msgs if not PATTERN.match(m)]
    return bad
