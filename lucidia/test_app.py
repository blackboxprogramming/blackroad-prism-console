import importlib
import os
import subprocess
import tempfile
from pathlib import Path

_GIT_IDENTITY_ENV = {
    "GIT_AUTHOR_NAME": "Lucidia Tests",
    "GIT_AUTHOR_EMAIL": "lucidia-tests@example.com",
    "GIT_COMMITTER_NAME": "Lucidia Tests",
    "GIT_COMMITTER_EMAIL": "lucidia-tests@example.com",
}


def _git(repo: Path, *args: str) -> None:
    """Run git commands with deterministic identity suitable for CI."""
    env = os.environ.copy()
    env.update(_GIT_IDENTITY_ENV)
    subprocess.run(
        ["git", *args],
        cwd=repo,
        check=True,
        capture_output=True,
        env=env,
    )

os.environ.setdefault("LUCIDIA_WORKSPACE", str(Path(__file__).resolve().parent))

app_module = importlib.import_module("lucidia.app")
app = app_module.app
WORKSPACE_ROOT = app_module.WORKSPACE_ROOT


def test_index():
    client = app.test_client()
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"Lucidia Co Coding Portal" in resp.data


def test_run_code():
    client = app.test_client()
    resp = client.post("/run", json={"code": "print('hi')"})
    assert resp.status_code == 200
    assert "hi" in resp.get_json()["output"]


def test_run_code_math():
    client = app.test_client()
    resp = client.post("/run", json={"code": "print(math.sqrt(16))"})
    assert resp.status_code == 200
    assert "4.0" in resp.get_json()["output"]


def test_run_code_rejects_import():
    """The code runner should block obvious security issues like imports."""
    client = app.test_client()
    resp = client.post("/run", json={"code": "import os"})
    assert resp.status_code == 400


def test_install_package():
    client = app.test_client()
    resp = client.post("/install", json={"package": "itsdangerous==2.2.0"})
    data = resp.get_json()
    assert resp.status_code == 200
    assert data["code"] == 0


def test_install_package_invalid():
    client = app.test_client()
    resp = client.post("/install", json={"package": "bad pkg"})
    assert resp.status_code == 400


def test_git_clean():
    with tempfile.TemporaryDirectory(dir=WORKSPACE_ROOT) as repo_dir:
        repo = Path(repo_dir)
        _git(repo, "init")
        (repo / "tracked.txt").write_text("tracked")
        _git(repo, "add", "tracked.txt")
        _git(repo, "commit", "-m", "init")
        (repo / "untracked.txt").write_text("temp")
        client = app.test_client()
        resp = client.post("/git/clean", json={"path": str(repo)})
        assert resp.status_code == 200
        assert not (repo / "untracked.txt").exists()


def test_git_clean_invalid_repo():
    with tempfile.TemporaryDirectory(dir=WORKSPACE_ROOT) as empty_dir:
        empty_path = Path(empty_dir)
        client = app.test_client()
        resp = client.post("/git/clean", json={"path": str(empty_path)})
        assert resp.status_code == 400


def test_git_clean_rejects_outside_workspace(tmp_path, monkeypatch):
    repo = tmp_path / "repo"
    repo.mkdir()
    _git(repo, "init")
    (repo / "tracked.txt").write_text("tracked")
    _git(repo, "add", "tracked.txt")
    _git(repo, "commit", "-m", "init")

    def _fail_run(*args, **kwargs):  # pragma: no cover - should not run
        raise AssertionError("subprocess.run should not be called for disallowed paths")

    monkeypatch.setattr(app_module.subprocess, "run", _fail_run)

    client = app.test_client()
    resp = client.post("/git/clean", json={"path": str(repo)})
    assert resp.status_code == 400


def test_math_endpoint():
    client = app.test_client()
    resp = client.post("/math", json={"expression": "x**2", "curious": True})
    data = resp.get_json()
    assert resp.status_code == 200
    assert data["result"] == "x**2"
    assert data["derivative"] == "2*x"

