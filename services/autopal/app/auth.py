"""OIDC token validation helpers for the AutoPal service."""

from __future__ import annotations

import threading
import time
from typing import Any, Dict

import jwt
from jwt import PyJWKClient

from .config import settings


class TokenVerificationError(RuntimeError):
    """Raised when a presented token fails validation."""


class TokenVerifier:
    """Validate JWTs issued by the configured OIDC issuer."""

    def __init__(self, jwks_url: str, cache_ttl: int) -> None:
        self._jwks_client = PyJWKClient(jwks_url)
        self._cache_ttl = cache_ttl
        self._last_refresh = 0.0
        self._lock = threading.Lock()

    def _maybe_refresh(self) -> None:
        now = time.monotonic()
        if now - self._last_refresh < self._cache_ttl:
            return
        with self._lock:
            if now - self._last_refresh < self._cache_ttl:
                return
            # PyJWKClient caches per-kid automatically; a dummy call forces refresh.
            self._jwks_client.clear_cache()
            self._last_refresh = now

    def verify(self, token: str, audience: str) -> Dict[str, Any]:
        try:
            self._maybe_refresh()
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=settings.oidc_issuer.rstrip("/"),
            )
        except Exception as exc:  # noqa: BLE001 - bubble up as service error
            raise TokenVerificationError(str(exc)) from exc
        return claims


_verifier: TokenVerifier | None = None


def get_token_verifier() -> TokenVerifier:
    """Return a singleton verifier bound to the configured settings."""

    global _verifier
    if _verifier is None:
        _verifier = TokenVerifier(settings.oidc_jwks_url, settings.cache_jwks_ttl)
    return _verifier
