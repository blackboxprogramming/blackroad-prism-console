from __future__ import annotations

import base64
import json
import pathlib
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Optional

import jwt

from ..config import Settings


@dataclass
class KeyMaterial:
    algorithm: str
    issuer: str
    kid: Optional[str]
    private_key: str | None
    public_key: str


class JWTService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.key_material = self._load_keys()

    def _load_keys(self) -> KeyMaterial:
        alg = self.settings.jwt_algorithm
        kid: str | None = None
        if alg.startswith("RS"):
            private_path = pathlib.Path(self.settings.jwt_private_key_path or "")
            public_path = pathlib.Path(self.settings.jwt_public_key_path or "")
            if not private_path.exists() or not public_path.exists():
                raise RuntimeError("RS256 algorithm selected but key paths are invalid")
            private_key = private_path.read_text()
            public_key = public_path.read_text()
            kid = str(uuid.uuid4())
        else:
            secret = self.settings.jwt_hs_secret
            if not secret:
                raise RuntimeError("HS algorithm selected but AUTH_JWT_HS_SECRET not provided")
            private_key = secret
            public_key = secret
        return KeyMaterial(algorithm=alg, issuer=self.settings.jwt_issuer, kid=kid, private_key=private_key, public_key=public_key)

    def encode(self, claims: Dict[str, Any]) -> str:
        headers: Dict[str, Any] = {}
        if self.key_material.kid:
            headers["kid"] = self.key_material.kid
        token = jwt.encode(
            payload=claims,
            key=self.key_material.private_key,
            algorithm=self.key_material.algorithm,
            headers=headers or None,
        )
        return token

    def decode(self, token: str) -> Dict[str, Any]:
        return jwt.decode(
            token,
            key=self.key_material.public_key,
            algorithms=[self.key_material.algorithm],
            audience=None,
            issuer=self.key_material.issuer,
            options={"require": ["iss", "sub", "exp", "iat", "jti"]},
        )

    def public_jwks(self) -> Dict[str, Any]:
        if not self.key_material.kid or not self.key_material.algorithm.startswith("RS"):
            return {"keys": []}
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import rsa

        key = serialization.load_pem_public_key(self.key_material.public_key.encode("utf-8"))
        if not isinstance(key, rsa.RSAPublicKey):
            raise RuntimeError("Invalid public key")
        numbers = key.public_numbers()
        e = base64.urlsafe_b64encode(numbers.e.to_bytes((numbers.e.bit_length() + 7) // 8, "big")).decode("utf-8").rstrip("=")
        n = base64.urlsafe_b64encode(numbers.n.to_bytes((numbers.n.bit_length() + 7) // 8, "big")).decode("utf-8").rstrip("=")
        return {
            "keys": [
                {
                    "kty": "RSA",
                    "alg": self.key_material.algorithm,
                    "use": "sig",
                    "kid": self.key_material.kid,
                    "n": n,
                    "e": e,
                }
            ]
        }
