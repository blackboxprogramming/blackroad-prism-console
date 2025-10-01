import importlib
import os
import subprocess
import tempfile
from pathlib import Path

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
        subprocess.run(["git", "init"], cwd=repo, check=True, capture_output=True)
        (repo / "tracked.txt").write_text("tracked")
        subprocess.run(["git", "add", "tracked.txt"], cwd=repo, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "init"], cwd=repo, check=True, capture_output=True)
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
    subprocess.run(["git", "init"], cwd=repo, check=True, capture_output=True)
    (repo / "tracked.txt").write_text("tracked")
    subprocess.run(["git", "add", "tracked.txt"], cwd=repo, check=True, capture_output=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=repo, check=True, capture_output=True)

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

