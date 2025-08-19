

from __future__ import annotations
from typing import Optional, Protocol

class LLMAdapter(Protocol):
    def generate(self, prompt: str, system: Optional[str] = None) -> str: ...

