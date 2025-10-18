"""Static smoke validation for ``services/api`` endpoints.

The Express bridge mixes CommonJS modules with an ``"type": "module"``
package, which makes spinning it up inside pytest brittle without modifying the
service.  Instead we assert that the key user-facing endpoints (health, echo,
and mini inference) remain defined in ``server.mjs``.
"""

from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SERVER_FILE = REPO_ROOT / "services" / "api" / "server.mjs"


def test_health_endpoint_declared() -> None:
    src = SERVER_FILE.read_text(encoding="utf-8")
    assert "/api/health.json" in src
    assert "blackroad-api-bridge" in src


def test_diagnostic_routes_present() -> None:
    src = SERVER_FILE.read_text(encoding="utf-8")
    assert "app.post(\"/api/echo\"" in src
    assert "app.post(\"/api/mini/infer\"" in src
