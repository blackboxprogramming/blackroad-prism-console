"""Light-weight smoke checks for the ``frontend`` React SPA.

The repository's root ``package.json`` is intentionally malformed, which makes
building the Vite bundle inside automated tests brittle.  Instead, these checks
validate the critical user flows directly from the source files: the routing
entry point and the tab layout wiring in ``App.jsx``.
"""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_SRC = REPO_ROOT / "frontend" / "src"


def test_frontend_router_exposes_novelty_and_app_routes() -> None:
    main = (FRONTEND_SRC / "main.jsx").read_text(encoding="utf-8")
    assert "createRoot" in main
    assert "BrowserRouter" in main
    assert 'path="/novelty"' in main
    assert 'element={<App />}' in main


def test_frontend_app_links_core_dashboards() -> None:
    app_src = (FRONTEND_SRC / "App.jsx").read_text(encoding="utf-8")
    for keyword in ("Dashboard", "RoadView", "Orchestrator", "Manifesto"):
        assert keyword in app_src, f"missing {keyword} navigation entry"
