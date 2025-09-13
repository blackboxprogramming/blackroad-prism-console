import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def test_demo_script_dry_run():
    subprocess.run(["scripts/demo.sh", "--dry-run"], cwd=REPO_ROOT, check=True)
