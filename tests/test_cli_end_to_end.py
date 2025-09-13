import subprocess
import sys


def test_cli_run():
    result = subprocess.run(
        [sys.executable, "-m", "cli.console", "bot:run", "--bot", "RevOps-BOT", "--goal", "Check forecast accuracy for Q3"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert "RevOps-BOT" in result.stdout
