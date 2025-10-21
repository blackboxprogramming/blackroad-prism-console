from pathlib import Path

from dx import docs_lint, style


def test_docs_and_style(tmp_path, monkeypatch):
    doc = tmp_path / "doc.md"
    doc.write_text("# H\n\n| a | b |\n|---|---|\n| 1 | 2 |\n")
    monkeypatch.setattr(docs_lint, "DOCS_FILES", [doc])
    problems = docs_lint.lint()
    assert problems == []

    py = tmp_path / "a.py"
    py.write_text("#\nprint(1)\n")
    monkeypatch.setattr(style, "TARGET_DIRS", [tmp_path])
    sprob = style.lint()
    assert sprob == []
