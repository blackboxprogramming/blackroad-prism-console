#
"""Documentation linter enforcing simple rules."""
from pathlib import Path
from typing import List

from . import ROOT, ARTIFACTS, inc_counter
from tools import storage

DOCS_FILES = [ROOT / "docs" / "dev-excellence.md"]


def lint(files: List[Path] = DOCS_FILES) -> List[str]:
    problems: List[str] = []
    for fp in files:
        text = fp.read_text().splitlines()
        if not any(line.startswith("#") for line in text):
            problems.append(f"{fp}: missing header")
        if len(text) > 100 and not any("Table of Contents" in line for line in text):
            problems.append(f"{fp}: missing TOC")
        for line in text:
            if "|" in line and "http" in line:
                problems.append(f"{fp}: external link in table")
    inc_counter("dx_docs_lint")
    report = ARTIFACTS / "docs_lint.md"
    lines = ["# Docs Lint", ""] + [f"- {p}" for p in problems]
    storage.write(str(report), "\n".join(lines))
    return problems
