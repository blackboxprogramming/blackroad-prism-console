import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def run_preflight(cwd, env=None):
    env = env or os.environ.copy()
    env.setdefault("PYTHONPATH", str(REPO_ROOT))
    return subprocess.run([sys.executable, "-m", "cli.console", "preflight:check"], cwd=cwd, env=env, capture_output=True)


def test_preflight_fail_missing_key(tmp_path):
    for d in ("config", "logs", "docs"):
        (tmp_path / d).mkdir()
    env = os.environ.copy()
    env["EAR_ENABLED"] = "1"
    result = run_preflight(tmp_path, env)
    assert result.returncode != 0


def test_preflight_ok(tmp_path):
    for d in ("config", "logs", "docs"):
        (tmp_path / d).mkdir()
    (tmp_path / "config/ear_key.json").write_text("{}")
    result = run_preflight(tmp_path)
    assert result.returncode == 0


def test_invalid_yaml_config(tmp_path):
    for d in ("config", "logs", "docs"):
        (tmp_path / d).mkdir()
    (tmp_path / "config/ear_key.json").write_text("{}")
    (tmp_path / "config/settings.yml").write_text(": bad yaml")
    result = run_preflight(tmp_path)
    assert result.returncode != 0
