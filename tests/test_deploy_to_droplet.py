import importlib.util
from pathlib import Path
from unittest.mock import call, patch

spec = importlib.util.spec_from_file_location("build", Path("codex/build.py"))
build = importlib.util.module_from_spec(spec)
assert spec.loader is not None  # for mypy
spec.loader.exec_module(build)


def test_deploy_runs_commands():
    expected = [
        call(
            "rsync -az var/www/blackroad/ blackroad.io:/var/www/blackroad/",
            dry_run=False,
        ),
        call(
            "rsync -az srv/blackroad-api/ blackroad.io:/srv/blackroad-api/",
            dry_run=False,
        ),
        call(
            "rsync -az srv/lucidia-llm/ blackroad.io:/srv/lucidia-llm/",
            dry_run=False,
        ),
        call(
            "rsync -az srv/lucidia-math/ blackroad.io:/srv/lucidia-math/",
            dry_run=False,
        ),
        call(
            "ssh blackroad.io sudo systemctl restart blackroad-api lucidia-llm lucidia-math",
            dry_run=False,
        ),
        call("ssh blackroad.io sudo systemctl reload nginx", dry_run=False),
    ]
    with patch.object(build, "run") as mock_run:
        build.deploy_to_droplet()
        assert mock_run.call_args_list == expected


def test_deploy_dry_run():
    with patch.object(build, "run") as mock_run:
        build.deploy_to_droplet(dry_run=True)
        for args in mock_run.call_args_list:
            assert args.kwargs.get("dry_run") is True
