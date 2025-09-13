from policy import deprecation


def test_deprecation_linter_finds_v1():
    issues = deprecation.lint_repo()
    assert any("SRE-BOT.v1" in msg for msg in issues)
