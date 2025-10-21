from pathlib import Path

from sec.detect.engine import run
from sec.purple.sim import run as purple_run


def test_purple_simulation():
    run(Path("configs/sec/rules"), Path("fixtures/sec/logs"))
    result = purple_run("brute_force_smoke", Path("configs/sec/purple"))
    assert result["passed"] is True
