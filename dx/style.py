#
"""Style linter for source files."""
from pathlib import Path
from typing import List

from . import ROOT, ARTIFACTS, inc_counter
from tools import storage

TARGET_DIRS = [ROOT / "dx"]


def lint(dirs: List[Path] = TARGET_DIRS) -> List[str]:
    problems: List[str] = []
    for d in dirs:
        for fp in d.rglob("*.py"):
            lines = fp.read_text().splitlines()
            if not lines or not lines[0].startswith("#"):
                problems.append(f"{fp}: missing file header")
            for idx, line in enumerate(lines, 1):
                if len(line) > 120:
                    problems.append(f"{fp}:{idx}: line too long")
    inc_counter("dx_style_lint")
    report = ARTIFACTS / "style_lint.md"
    lines = ["# Style Lint", ""] + [f"- {p}" for p in problems]
    storage.write(str(report), "\n".join(lines))
    return problems
