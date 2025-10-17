"""Smoke checks for the Next.js PRISM console living under ``app/``.

The goal of these tests is simply to make sure the primary, user-facing
surface area for the console is still present.  We do this by inspecting the
statically-defined layout and ensuring that the dashboard wiring is intact.
"""

from __future__ import annotations

from pathlib import Path
import re


REPO_ROOT = Path(__file__).resolve().parents[1]
APP_DIR = REPO_ROOT / "app"


def test_prism_console_homepage_has_primary_heading() -> None:
    """Validate that the PRISM landing page still renders its headline.

    The homepage is a static React component, so checking the source ensures
    the build continues to expose the expected hero text and overall structure
    that users rely on when loading the console.
    """

    src = (APP_DIR / "page.tsx").read_text(encoding="utf-8")
    assert re.search(r"<h1[^>]*>PRISM Console</h1>", src)


def test_tiles_dashboard_requests_feature_flag_snapshot() -> None:
    """Ensure the dashboard still pulls the three primary feature tiles.

    These tiles (GitHub, Linear, Stripe) are the critical user entry points on
    the console.  The smoke test confirms that their flag toggles and fetches
    are still present in the client component.
    """

    dashboard = (APP_DIR / "prism" / "TilesDashboard.tsx").read_text(
        encoding="utf-8"
    )
    for feature in ("prismGithub", "prismLinear", "prismStripe"):
        assert feature in dashboard, f"missing feature toggle: {feature}"
    assert "/api/prism/github/issues_opened" in dashboard
    assert "/api/prism/linear/board" in dashboard
    assert "/api/prism/stripe/summary" in dashboard
