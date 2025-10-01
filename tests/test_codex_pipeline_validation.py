from unittest import mock

import tools.codex_pipeline as pipeline


class DummyResponse:
    def __init__(self, code: int, body: str) -> None:
        self._code = code
        self._body = body

    def getcode(self) -> int:  # pragma: no cover - used by urlopen
        return self._code

    def read(self) -> bytes:  # pragma: no cover - used by urlopen
        return self._body.encode()

    def __enter__(self) -> "DummyResponse":  # pragma: no cover - context manager
        return self

    def __exit__(self, *exc: object) -> None:  # pragma: no cover
        return None


def test_validate_services_all_ok(monkeypatch, tmp_path):
    monkeypatch.setattr(pipeline, "LOG_FILE", tmp_path / "log")
    responses = [DummyResponse(200, '{"status": "ok"}') for _ in range(4)]
    monkeypatch.setattr(pipeline.request, "urlopen", mock.Mock(side_effect=responses))

    summary = pipeline.validate_services()
    assert all(summary[name] == "OK" for name in ["frontend", "api", "llm", "math"])
    assert "timestamp" in summary


def test_validate_services_failure(monkeypatch, tmp_path):
    monkeypatch.setattr(pipeline, "LOG_FILE", tmp_path / "log")
    responses = [
        DummyResponse(200, '{"status": "ok"}'),
        DummyResponse(500, "{}"),
        DummyResponse(200, '{"status": "ok"}'),
        DummyResponse(200, '{"status": "ok"}'),
    ]
    monkeypatch.setattr(pipeline.request, "urlopen", mock.Mock(side_effect=responses))

    summary = pipeline.validate_services()
    assert summary["api"] == "FAIL"


def test_skip_validate(monkeypatch):
    called = False

    def fake_validate() -> dict[str, str]:  # pragma: no cover - patched
        nonlocal called
        called = True
        return {}

    monkeypatch.setattr(pipeline, "validate_services", fake_validate)
    monkeypatch.setattr(pipeline, "push_latest", lambda: None)
    monkeypatch.setattr(pipeline, "redeploy_droplet", lambda: None)

    pipeline.main(["--skip-validate", "push"])
    assert called is False


def test_dry_run_skips_validate(monkeypatch):
    called = False

    def fake_validate() -> dict[str, str]:  # pragma: no cover - patched
        nonlocal called
        called = True
        return {}

    monkeypatch.setattr(pipeline, "validate_services", fake_validate)
    monkeypatch.setattr(pipeline, "push_latest", lambda dry_run: None)
    monkeypatch.setattr(pipeline, "redeploy_droplet", lambda dry_run: None)

    pipeline.main(["--dry-run", "push"])
    assert called is False
