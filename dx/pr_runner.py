#
"""Run local PR bots on a spec file."""
import json
from pathlib import Path
from typing import Dict, List

from . import ARTIFACTS, inc_counter
from .pr_bots import available_bots, BotResult
from tools import storage


def run(spec_path: Path) -> List[BotResult]:
    spec = json.loads(spec_path.read_text())
    results = [bot.run(spec) for bot in available_bots()]
    report_lines = [f"# PR Report {spec.get('id', 'na')}", "", "| bot | vote | details |", "|---|---|---|"]
    for r in results:
        report_lines.append(f"| {r.name} | {r.vote} | {r.details} |")
    out = ARTIFACTS / "pr_reports" / f"{spec.get('id', 'na')}.md"
    storage.write(str(out), "\n".join(report_lines))
    inc_counter("dx_pr_bot_vote")
    return results
