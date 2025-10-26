from __future__ import annotations

from typing import Any, Dict


def cors_options(origins: list[str]) -> Dict[str, Any]:
    return {
        "allow_origins": origins,
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
        "expose_headers": ["X-Request-ID"],
    }


__all__ = ["cors_options"]
