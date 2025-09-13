from __future__ import annotations

import os
from typing import List

# Global application settings with environment overrides.

MAX_ARTIFACT_MB: int = int(os.getenv("MAX_ARTIFACT_MB", "5"))
FORBIDDEN_BOTS: List[str] = [b for b in os.getenv("FORBIDDEN_BOTS", "").split(",") if b]
FORBIDDEN_INTENTS: List[str] = [i for i in os.getenv("FORBIDDEN_INTENTS", "").split(",") if i]
DRY_RUN: bool = os.getenv("DRY_RUN", "false").lower() in {"1", "true", "yes"}
