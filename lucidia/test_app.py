import subprocess
import sys

from lucidia.app import app


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


def test_install_package(monkeypatch):
    client = app.test_client()

    class FakeCompletedProcess:
        returncode = 0
        stdout = "installed"
        stderr = ""

    calls: list[list[str]] = []

    def fake_run(
        cmd, capture_output, text, **kwargs
    ):  # noqa: ANN001, ARG002 - match subprocess signature
        calls.append(cmd)
        return FakeCompletedProcess()

    monkeypatch.setattr("lucidia.app.subprocess.run", fake_run)

    resp = client.post("/install", json={"package": "itsdangerous==2.2.0"})
    data = resp.get_json()
    assert resp.status_code == 200
    assert data["code"] == 0
    assert calls == [[sys.executable, "-m", "pip", "install", "itsdangerous==2.2.0"]]


def test_install_package_missing_value():
    client = app.test_client()
    resp = client.post("/install", json={})
    assert resp.status_code == 400


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


def test_git_clean_invalid_path():
    client = app.test_client()
    resp = client.post("/git/clean", json={"path": "/does/not/exist"})
    assert resp.status_code == 400


def test_git_clean_requires_git_repo(tmp_path):
    folder = tmp_path / "plain"
    folder.mkdir()
    client = app.test_client()
    resp = client.post("/git/clean", json={"path": str(folder)})
    assert resp.status_code == 400
