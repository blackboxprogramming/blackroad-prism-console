"""Simple file-based search agent."""
from __future__ import annotations

from pathlib import Path
from typing import List, Dict


class Roadie:
    """Searches text files in a memory directory for a query string."""

    def __init__(self, memory_dir: str | Path) -> None:
        self.memory_path = Path(memory_dir)

    def search(self, query: str) -> List[Dict[str, str]]:
        """Return list of files containing the query with small snippets."""
        results: List[Dict[str, str]] = []
        if not self.memory_path.is_dir():
            return results

        for path in self.memory_path.rglob("*"):
            if path.is_file():
                try:
                    text = path.read_text(encoding="utf-8", errors="ignore")
                except OSError:
                    continue
                if query.lower() in text.lower():
                    snippet = text[:200]
                    results.append({"file": str(path), "snippet": snippet})
        return results
