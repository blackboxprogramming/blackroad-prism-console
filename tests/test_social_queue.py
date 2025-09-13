import json
from pathlib import Path
from marketing import social


def test_social_queue_dry_run():
    social.queue_post("linkedin", "hi")
    social.run_queue(dry_run=True)
    hist = Path("artifacts/marketing/social_history.jsonl").read_text().strip().splitlines()
    assert hist
    rec = json.loads(hist[0])
    assert rec["status"] == "dry-run"
