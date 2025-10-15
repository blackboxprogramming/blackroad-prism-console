import status.generator as generator


def _setup_writers(monkeypatch):
    writes = {}

    def fake_validate(path, data, schema_path):
        writes[path] = data

    metric_calls = []

    def fake_emit(name, value=1.0):
        metric_calls.append((name, value))

    monkeypatch.setattr(generator.artifacts, "validate_and_write", fake_validate)
    monkeypatch.setattr(generator.metrics, "emit", fake_emit)
    return writes, metric_calls


def test_build_warns_when_catalog_missing(monkeypatch):
    writes, metrics = _setup_writers(monkeypatch)
    monkeypatch.setattr(generator, "_load_catalog", lambda: [])
    generator.build()

    report = writes["artifacts/status/index.md"]
    assert "No services were found in the catalog" in report
    assert metrics == [("status_builds", 1)]


def test_build_tracks_services_without_checks(monkeypatch):
    writes, _ = _setup_writers(monkeypatch)
    monkeypatch.setattr(generator, "_load_catalog", lambda: [{"id": "billing"}])
    monkeypatch.setattr(generator, "_load_health", lambda service: {"checks": []})

    generator.build()
    report = writes["artifacts/status/index.md"]

    assert "| billing | N/A | no checks available |" in report
    assert "have no recorded health checks: billing" in report
