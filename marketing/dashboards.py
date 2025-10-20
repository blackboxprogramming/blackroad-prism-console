import json
from pathlib import Path

from tools import metrics, storage

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = ROOT / "artifacts/marketing"


def build_dashboard() -> None:
    segs = json.loads(storage.read(str(ARTIFACTS_DIR / "segments.json")) or "{}")
    lead = json.loads(storage.read(str(ARTIFACTS_DIR / "lead_scores.json")) or "{}")
    seo_issues = json.loads(storage.read(str(ARTIFACTS_DIR / "seo/issues.json")) or "[]")
    cal = json.loads(storage.read(str(ARTIFACTS_DIR / "calendar.json")) or "[]")
    queue_lines = storage.read(str(ARTIFACTS_DIR / "social_queue.jsonl")).splitlines()
    lines = ["# Marketing Dashboard", "## Segments"]
    for name, ids in segs.items():
        lines.append(f"- {name}: {len(ids)}")
    lines.append("## Lead Scores")
    lines.append(f"contacts scored: {len(lead)}")
    lines.append("## SEO")
    lines.append(f"issues: {len(seo_issues)}")
    lines.append("## Calendar")
    lines.append(f"items: {len(cal)}")
    lines.append("## Social Queue")
    lines.append(f"queued: {len([l for l in queue_lines if l])}")
    md = "\n".join(lines)
    storage.write(str(ARTIFACTS_DIR / "dashboard.md"), md)
    html = "<pre>" + md + "</pre>"
    storage.write(str(ARTIFACTS_DIR / "dashboard.html"), html)
    metrics.emit("marketing_dashboard_built")
