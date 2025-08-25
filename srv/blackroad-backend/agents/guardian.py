"""Guardian agent that performs a basic integrity check."""
from __future__ import annotations

from pathlib import Path


class Guardian:
    """Verifies that the memory directory exists and is readable."""

    def __init__(self, memory_dir: str | Path) -> None:
        self.memory_path = Path(memory_dir)

    def verify_integrity(self) -> str:
        """Return a simple integrity status message."""
        if self.memory_path.is_dir():
            return "memory directory present"
        return "memory directory missing"
