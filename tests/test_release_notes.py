import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def test_release_notes(tmp_path):
    notes = tmp_path / "notes.yml"
    notes.write_text('{"features": ["demo"], "docs": ["doc"]}')
    subprocess.run([
        sys.executable,
        "-m",
        "cli.console",
        "release:notes",
        "--version",
        "0.1.0",
        "--notes",
        str(notes),
    ], cwd=REPO_ROOT, check=True)
    out_file = REPO_ROOT / "dist" / "release-notes-0.1.0.md"
    assert out_file.exists()
    content = out_file.read_text()
    assert "demo" in content
    assert "doc" in content
    out_file.unlink()
