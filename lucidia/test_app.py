import pytest

from lucidia.app import GLOBAL_VARS, app


@pytest.fixture(autouse=True)
def clear_state():
    """Ensure each test has an isolated execution environment."""
    GLOBAL_VARS.clear()


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


def test_state_and_builtins():
    client = app.test_client()
    client.post("/run", json={"code": "nums = list(range(3))"})
    resp = client.post("/run", json={"code": "print(len(nums))"})
    assert resp.status_code == 200
    assert resp.get_json()["output"].strip() == "3"
