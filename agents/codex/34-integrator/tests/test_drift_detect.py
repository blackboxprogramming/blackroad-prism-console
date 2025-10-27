from __future__ import annotations

from agents.codex._34_integrator.pipelines.drift_detect import detect


def test_drift_detect_reports_missing_fields() -> None:
    sample = {
        "source": "github",
        "payload": {
            "event_type": "push",
            "ts": "2024-01-01T00:00:00Z",
        },
    }

    report = detect(sample)

    assert report["drift"] is True
    assert "id" in " ".join(report["missing_fields"])
    assert report["unexpected_fields"] == []
