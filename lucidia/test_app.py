import subprocess

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


def test_run_code_math():
    client = app.test_client()
    resp = client.post("/run", json={"code": "print(math.sqrt(16))"})
    assert resp.status_code == 200
    assert "4.0" in resp.get_json()["output"]


def test_install_package():
    client = app.test_client()
    resp = client.post("/install", json={"package": "itsdangerous==2.2.0"})
    data = resp.get_json()
    assert resp.status_code == 200
    assert data["code"] == 0


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


def test_math_endpoint():
    client = app.test_client()
    resp = client.post("/math", json={"expression": "x**2", "curious": True})
    data = resp.get_json()
    assert resp.status_code == 200
    assert data["result"] == "x**2"
    assert data["derivative"] == "2*x"
