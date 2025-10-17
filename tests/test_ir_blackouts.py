from pathlib import Path
import ir.blackouts as blackouts


def test_blackout_and_quiet(monkeypatch, tmp_path):
    cfg = tmp_path / "black.yaml"
    cfg.write_text("""
quiet_periods:
  - start: 2025-09-01
    end: 2025-10-01
blackouts:
  - start: 2025-09-10
    end: 2025-09-20
""")
    monkeypatch.setattr(blackouts, "CONFIG_PATH", cfg)
    assert blackouts.status("2025-09-12") == "IR_BLACKOUT_BLOCK"
    assert blackouts.status("2025-09-05") == "IR_QUIET_PERIOD"
    assert blackouts.status("2025-11-01") is None
