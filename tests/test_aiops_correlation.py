import json
from datetime import datetime, timedelta
from pathlib import Path

from aiops import correlation


def test_correlation(tmp_path: Path):
    now = datetime.utcnow()
    sources = {
        "healthchecks": [
            {
                "service": "CoreAPI",
                "status": "degraded",
                "timestamp": (now - timedelta(minutes=1)).isoformat(),
            }
        ],
        "incidents": [
            {
                "service": "CoreAPI",
                "severity": "high",
                "timestamp": (now - timedelta(minutes=2)).isoformat(),
            }
        ],
        "changes": [
            {
                "service": "CoreAPI",
                "type": "deploy",
                "timestamp": (now - timedelta(minutes=3)).isoformat(),
            }
        ],
    }
    res = correlation.correlate(now, sources, artifacts_dir=tmp_path)
    assert res and res[0]["kind"] == "brownout"
    files = list((tmp_path / "aiops").glob("correlations_*.json"))
    assert files
