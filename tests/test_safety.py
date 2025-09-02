import sys
from pathlib import Path

# Allow importing the safety module despite hyphenated directory name
sys.path.append(str(Path(__file__).resolve().parents[1] / "services" / "discord-bot" / "src"))

from safety import Safety  # type: ignore  # pylint: disable=import-error


def test_blocklist_hard_blocks_case_insensitively():
    s = Safety(blocklist=[r"bad"], pii_patterns=[], action="hard")
    blocked, cleaned, hits = s.scan("This BAD content")
    assert blocked
    assert hits == ["bad"]
    assert cleaned == "This BAD content"


def test_blocklist_soft_flags_without_blocking():
    s = Safety(blocklist=[r"bad"], pii_patterns=[], action="soft")
    blocked, _, hits = s.scan("bad news")
    assert not blocked
    assert hits == ["bad"]


def test_pii_redaction_case_insensitive():
    s = Safety(blocklist=[], pii_patterns=[r"secret"], action="soft")
    _, cleaned, hits = s.scan("My SECRET code")
    assert "[REDACTED-PII]" in cleaned
    assert "SECRET" not in cleaned
    assert hits == []
