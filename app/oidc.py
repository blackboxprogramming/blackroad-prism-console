from __future__ import annotations

import json
import time
from typing import Any, Dict, Optional

import httpx
import jwt
from jwt import exceptions as jwt_exceptions
from cachetools import TTLCache

from .config import ConfigHolder

_jwks_cache: TTLCache[str, Dict[str, Any]] = TTLCache(maxsize=1, ttl=600)  # 10 min


def _get_jwks(jwks_url: str) -> Dict[str, Any]:
    if "jwks" in _jwks_cache:
        return _jwks_cache["jwks"]
    resp = httpx.get(jwks_url, timeout=5.0)
    resp.raise_for_status()
    data = resp.json()
    _jwks_cache["jwks"] = data
    return data


def verify_oidc(cfg: ConfigHolder, id_token: str, audience: Optional[str]) -> Dict[str, Any]:
    """Returns decoded claims if valid; raises on failure."""

    oidc = cfg.current.auth["oidc"]
    issuer = oidc["issuer"]
    jwks_url = oidc["jwks_url"]
    skew = int(oidc.get("clock_skew_seconds", 300))

    jwks = _get_jwks(jwks_url)
    kid = jwt.get_unverified_header(id_token)["kid"]
    key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
    if not key:
        raise ValueError("Unknown key id")

    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
    try:
        claims = jwt.decode(
            id_token,
            key=public_key,
            algorithms=["RS256", "RS384", "RS512"],
            audience=audience,
            issuer=issuer,
            leeway=skew,
        )
    except jwt_exceptions.InvalidAudienceError as exc:
        raise ValueError("audience_not_allowed") from exc

    allowed = cfg.current.auth["oidc"].get("audience_allowlist", [])
    aud_claim = claims.get("aud")
    if aud_claim is None:
        raise ValueError("missing_audience")
    if not any(
        (a.endswith("*") and str(aud_claim).startswith(a[:-1])) or str(aud_claim) == a
        for a in allowed
    ):
        raise ValueError("audience_not_allowed")

    now = int(time.time())
    if claims.get("nbf") and claims["nbf"] - skew > now:
        raise ValueError("token_not_yet_valid")

    return claims
