import importlib.util
import os
import subprocess
from pathlib import Path

import pytest

_spec = importlib.util.spec_from_file_location(
    "codex.build", Path(__file__).resolve().parents[1] / "codex" / "build.py"
)
build = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(build)  # type: ignore[union-attr]


def _init_repo(path: Path, bare: bool = False) -> Path:
    args = ["git", "init", str(path)]
    if bare:
        args.insert(2, "--bare")
    args.insert(-1, "-b")
    args.insert(-1, "main")
    subprocess.run(args, check=True)
    if not bare:
        subprocess.run(["git", "-C", str(path), "config", "user.email", "test@example.com"], check=True)
        subprocess.run(["git", "-C", str(path), "config", "user.name", "Test User"], check=True)
    return path


def test_push_to_github(tmp_path: Path) -> None:
    remote = _init_repo(tmp_path / "remote.git", bare=True)
    repo = _init_repo(tmp_path / "repo")

    (repo / "file.txt").write_text("initial\n")
    subprocess.run(["git", "-C", str(repo), "add", "."], check=True)
    subprocess.run(["git", "-C", str(repo), "commit", "-m", "init"], check=True)
    subprocess.run(["git", "-C", str(repo), "remote", "add", "origin", str(remote)], check=True)
    subprocess.run(["git", "-C", str(repo), "push", "origin", "main"], check=True)

    (repo / "file.txt").write_text("change\n")
    cwd = os.getcwd()
    os.chdir(repo)
    try:
        build.push_to_github("main")
    finally:
        os.chdir(cwd)

    msg = subprocess.run(
        ["git", "--git-dir", str(remote), "log", "-1", "--pretty=%s"],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    assert msg == build.AUTO_COMMIT_MESSAGE


def test_pull_from_github_conflict(tmp_path: Path) -> None:
    remote = _init_repo(tmp_path / "remote.git", bare=True)
    repo = _init_repo(tmp_path / "repo")

    (repo / "file.txt").write_text("base\n")
    subprocess.run(["git", "-C", str(repo), "add", "."], check=True)
    subprocess.run(["git", "-C", str(repo), "commit", "-m", "base"], check=True)
    subprocess.run(["git", "-C", str(repo), "remote", "add", "origin", str(remote)], check=True)
    subprocess.run(["git", "-C", str(repo), "push", "origin", "main"], check=True)

    remote_work = tmp_path / "remote_work"
    subprocess.run(["git", "clone", str(remote), str(remote_work)], check=True)
    subprocess.run(["git", "-C", str(remote_work), "config", "user.email", "test@example.com"], check=True)
    subprocess.run(["git", "-C", str(remote_work), "config", "user.name", "Test User"], check=True)
    (remote_work / "file.txt").write_text("remote\n")
    subprocess.run(["git", "-C", str(remote_work), "commit", "-am", "remote"], check=True)
    subprocess.run(["git", "-C", str(remote_work), "push", "origin", "main"], check=True)

    (repo / "file.txt").write_text("local\n")
    subprocess.run(["git", "-C", str(repo), "commit", "-am", "local"], check=True)

    cwd = os.getcwd()
    os.chdir(repo)
    try:
        with pytest.raises(RuntimeError):
            build.pull_from_github("main")
    finally:
        os.chdir(cwd)

    error_log = (repo / "build_errors.log").read_text()
    assert "Merge conflicts detected" in error_log
