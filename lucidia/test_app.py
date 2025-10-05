import subprocess
import sys

from lucidia.app import ALLOWLISTED_PACKAGES, app


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


def test_install_package_allowlisted(monkeypatch):
    client = app.test_client()

    called = {}

    def fake_run(cmd, capture_output, text, env):
        called["cmd"] = cmd
        called["env"] = env

        class Result:
            returncode = 0
            stdout = "installed"
            stderr = ""

        return Result()

    monkeypatch.setattr("lucidia.app.subprocess.run", fake_run)

    resp = client.post("/install", json={"package": "itsdangerous"})
    data = resp.get_json()

    assert resp.status_code == 200
    assert data["code"] == 0
    assert called["cmd"] == [
        sys.executable,
        "-m",
        "pip",
        "install",
        "--disable-pip-version-check",
        "--no-deps",
        "--no-build-isolation",
        ALLOWLISTED_PACKAGES["itsdangerous"],
    ]
    assert called["env"].get("PIP_NO_INPUT") == "1"


def test_install_package_invalid():
    client = app.test_client()
    resp = client.post("/install", json={"package": "bad pkg"})
    assert resp.status_code == 400


def test_install_package_rejected():
    client = app.test_client()
    resp = client.post("/install", json={"package": "numpy"})
    data = resp.get_json()
    assert resp.status_code == 403
    assert data["error"] == "package not allowed"


def test_git_clean(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()
    subprocess.run(["git", "init"], cwd=repo, check=True, capture_output=True)
    (repo / "tracked.txt").write_text("tracked")
    subprocess.run(["git", "add", "tracked.txt"], cwd=repo, check=True, capture_output=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=repo, check=True, capture_output=True)
    (repo / "untracked.txt").write_text("temp")
    client = app.test_client()
    resp = client.post("/git/clean", json={"path": str(repo)})
    assert resp.status_code == 200
    assert not (repo / "untracked.txt").exists()


def test_git_clean_invalid_repo(tmp_path):
    empty_dir = tmp_path / "empty"
    empty_dir.mkdir()
    client = app.test_client()
    resp = client.post("/git/clean", json={"path": str(empty_dir)})
    assert resp.status_code == 400


def test_math_endpoint():
    client = app.test_client()
    resp = client.post("/math", json={"expression": "x**2", "curious": True})
    data = resp.get_json()
    assert resp.status_code == 200
    assert data["result"] == "x**2"
    assert data["derivative"] == "2*x"

