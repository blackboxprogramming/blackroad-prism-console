#!/usr/bin/env python3
"""Generate changelog JSON for the last 48 hours."""
from __future__ import annotations

import datetime as dt
import json
import subprocess
from pathlib import Path

MERGE_PLAN = Path("merge_plan.json")


def git_changed_files() -> list[str]:
    since = (dt.datetime.utcnow() - dt.timedelta(hours=48)).isoformat()
    cmd = ["git", "log", f"--since={since}", "--name-only", "--pretty=format:"]
    out = subprocess.check_output(cmd, text=True)
    files = sorted({line.strip() for line in out.splitlines() if line.strip()})
    return files


def services_restarted() -> list[str]:
    if not MERGE_PLAN.exists():
        return []
    data = json.loads(MERGE_PLAN.read_text())
    services = set()
    for pr in data.get("queue", []):
        for svc in pr.get("impacts", []):
            services.add(svc)
    return sorted(services)


def main() -> None:
    ts = dt.datetime.utcnow().strftime("%Y%m%d%H")
    log = {
        "timestamp": dt.datetime.utcnow().isoformat() + "Z",
        "files_changed": git_changed_files(),
        "services_restarted": services_restarted(),
        "health_checks": [
            "https://blackroad.io/healthz",
            "http://127.0.0.1:4010/api/llm/health",
            "http://127.0.0.1:12345/yjs/test",
            "https://blackroad.io/relay (403 without cert)",
            "https://blackroad.io/api/projects",
            "https://blackroad.io/api/devices",
        ],
    }
    out_path = Path(f"srv/ops/changelogs/CHANGELOG-{ts}.json")
    out_path.write_text(json.dumps(log, indent=2))


if __name__ == "__main__":
    main()
