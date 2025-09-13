from pathlib import Path

from dx import commits


def test_commit_lint(tmp_path):
    log = tmp_path / "c.log"
    log.write_text("feat: ok\ninvalid\n")
    bad = commits.lint(log_file=log)
    assert bad == ["invalid"]
