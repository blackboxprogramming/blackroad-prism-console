"""Minimal mock OIDC issuer for local development."""

from __future__ import annotations

import os
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from uuid import uuid4

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, Field

import jwt

from services.observability import DependencyRecorder, DependencyStatus


def _b64(value: int) -> str:
    return jwt.utils.base64url_encode(value.to_bytes((value.bit_length() + 7) // 8, "big")).decode()


def _build_private_key() -> RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


class TokenRequest(BaseModel):
    sub: str = Field(..., description="Subject claim")
    aud: str = Field(..., description="Audience claim")
    exp: int = Field(..., description="Expiry in seconds or absolute timestamp")


app = FastAPI(title="Mock OIDC Issuer", version="0.1.0")
_private_key = _build_private_key()
_kid = os.getenv("MOCK_ISSUER_KID", uuid4().hex)
_dependency_recorder = DependencyRecorder("mock-issuer")


def _dependency_status() -> dict[str, DependencyStatus]:
    deps: dict[str, DependencyStatus] = {}
    if _private_key is None:
        deps["signing_key"] = DependencyStatus.error("missing private key")
    else:
        deps["signing_key"] = DependencyStatus.ok("loaded")

    if not _kid:
        deps["kid"] = DependencyStatus.degraded("kid env missing")
    else:
        deps["kid"] = DependencyStatus.ok(_kid)
    return deps


def _issuer_url() -> str:
    base = os.getenv("MOCK_ISSUER_URL", "http://mock-issuer:8081/").strip()
    if not base.endswith("/"):
        base = f"{base}/"
    return base


def _jwks() -> Dict[str, Any]:
    public_numbers = _private_key.public_key().public_numbers()
    return {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "kid": _kid,
                "n": _b64(public_numbers.n),
                "e": _b64(public_numbers.e),
            }
        ]
    }


@app.get("/.well-known/openid-configuration")
async def configuration() -> Dict[str, Any]:
    issuer = _issuer_url()
    return {
        "issuer": issuer.rstrip("/"),
        "jwks_uri": f"{issuer.rstrip('/')}/.well-known/jwks.json",
        "token_endpoint": f"{issuer.rstrip('/')}/token",
        "id_token_signing_alg_values_supported": ["RS256"],
    }


@app.get("/.well-known/jwks.json")
async def jwks() -> Dict[str, Any]:
    return _jwks()


@app.get("/healthz")
async def healthz() -> Dict[str, object]:
    return _dependency_recorder.snapshot(_dependency_status())


@app.get("/metrics")
async def metrics() -> Response:
    _dependency_recorder.snapshot(_dependency_status())
    return Response(
        content=_dependency_recorder.render_prometheus(),
        media_type=_dependency_recorder.prometheus_content_type,
    )


@app.post("/token")
async def mint_token(request: TokenRequest) -> Dict[str, str]:
    now = datetime.now(timezone.utc)
    if request.exp > 1_000_000_000:
        expires_at = datetime.fromtimestamp(request.exp, tz=timezone.utc)
    else:
        expires_at = now + timedelta(seconds=request.exp)

    if expires_at <= now:
        raise HTTPException(status_code=400, detail="exp must be in the future")

    payload = {
        "iss": _issuer_url().rstrip("/"),
        "sub": request.sub,
        "aud": request.aud,
        "iat": int(time.time()),
        "nbf": int(time.time()),
        "exp": int(expires_at.timestamp()),
    }

    token = jwt.encode(
        payload,
        _private_key,
        algorithm="RS256",
        headers={"kid": _kid},
    )
    return {"id_token": token}
