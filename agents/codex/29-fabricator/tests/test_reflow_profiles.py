"""Verify reflow profiles meet baseline requirements."""

from pathlib import Path

LIB_DIR = Path(__file__).resolve().parents[1] / "libs"


def _load_profiles() -> dict:
    profiles = {}
    current = None
    for line in (LIB_DIR / "reflow_profiles.yaml").read_text().splitlines():
        if not line.strip():
            continue
        if not line.startswith(" "):
            key = line.rstrip(":")
            profiles[key] = {}
            current = profiles[key]
            continue
        if current is None:
            continue
        name, value = [part.strip() for part in line.split(":", 1)]
        current[name] = float(value)
    return profiles


def test_lead_free_peak_temperature():
    profiles = _load_profiles()
    assert profiles["lead_free"]["peak_temp_c"] >= 240


def test_low_temp_shorter_liquidus_time():
    profiles = _load_profiles()
    assert profiles["low_temp"]["time_above_liquidus_s"] < profiles["lead_free"][
        "time_above_liquidus_s"
    ]
