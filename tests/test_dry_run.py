import shutil
import subprocess
from pathlib import Path


def test_dry_run_skips_artifacts(tmp_path):
    art = Path("artifacts")
    if art.exists():
        shutil.rmtree(art)
    result = subprocess.run(
        [
            "python",
            "-m",
            "cli.console",
            "--dry-run",
            "bot:run",
            "--bot",
            "Treasury-BOT",
            "--goal",
            "Build 13-week cash view",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "DRY-RUN: no artifacts written" in result.stdout
    assert not any(art.glob("T*/response.json"))
