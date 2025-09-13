from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from tools import storage, metrics
from . import utils


@dataclass
class Memo:
    period: str
    theme: str
    body: str


def build(period: str, theme: str) -> Memo:
    body = "\n".join([
        "# Context",
        "# What Changed",
        "# Options",
        "# Recommendation",
        "# Risks",
        "# Next Steps",
    ])
    out_dir = utils.ARTIFACTS / "memos" / period
    utils._ensure_dir(out_dir / "tmp")
    storage.write(str(out_dir / f"{theme}.md"), body)
    metrics.emit("memos_built")
    utils.validate_and_write("strategy_memos", {"period": period, "theme": theme})
    return Memo(period=period, theme=theme, body=body)
