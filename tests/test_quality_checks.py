from pathlib import Path

from quality import checks


def test_quality_checks(tmp_path):
    art = tmp_path / "exec.md"
    art.write_text("Owner: TBD\nNorth report\n")
    cfg = tmp_path / "cfg.yaml"
    cfg.write_text(
        """
required_segments: ["North", "South"]
fairness:
  threshold: 5
  groups:
    a: 1
    b: 10
required_fields: ["Owner", "Timeline"]
"""
    )
    findings = checks.assess(art, cfg)
    codes = {f.code for f in findings}
    assert {"REP_GAP", "FAIR_DELTA", "INCOMPLETE"}.issubset(codes)
