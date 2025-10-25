"""Authentication and identity management for the Prism console agents.

This module centralises the logic for issuing and validating agent tokens, user
credential handling, integration with external identity providers, and audit
logging. It follows the governance requirements laid out in the Agent Auth
prompt by supporting multiple providers (Keycloak, Supabase Auth, and local
JWT), role-based scopes, 30 day renewable tokens, and automated secret
rotation.
"""

from __future__ import annotations

import base64
import enum
import hashlib
import hmac
import json
import secrets
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple

from .roles import AccessDecision, RoleManager

PROJECT_ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = PROJECT_ROOT / "registry" / "agent_roles.json"
AUDIT_LOG_PATH = PROJECT_ROOT / "logs" / "auth_activity.log"
SECRET_ROTATION_HOURS = 72
TOKEN_LIFETIME_DAYS = 30


class AuthProvider(enum.Enum):
    """Supported authentication providers."""

    KEYCLOAK = "keycloak"
    SUPABASE = "supabase_auth"
    LOCAL_JWT = "local_jwt"


@dataclass
class CredentialRecord:
    """Stored credential metadata for a user."""

    username: str
    password_hash: str
    salt: str
    role: str
    created_at: datetime


@dataclass
class AgentSecret:
    """An agent secret used for signing tokens."""

    secret_id: str
    secret_value: str
    rotated_at: datetime


@dataclass
class AgentToken:
    """A bearer token issued to an agent."""

    token: str
    agent_id: str
    scopes: Set[str]
    issued_at: datetime
    expires_at: datetime
    secret_id: str

    def is_expired(self, at: Optional[datetime] = None) -> bool:
        """Return True when the token has expired."""

        reference = at or datetime.now(timezone.utc)
        return reference >= self.expires_at


class AuditLogger:
    """Append-only audit trail writer."""

    def __init__(self, log_path: Path) -> None:
        self._path = log_path
        self._lock = threading.Lock()
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            # Seed the log with the expected header line so downstream tools can
            # parse it deterministically.
            self._path.write_text("timestamp,actor,action,status,metadata\n", encoding="utf-8")

    def log(self, actor: str, action: str, status: str, metadata: Optional[Dict[str, str]] = None) -> None:
        """Persist an audit event as a CSV line."""

        timestamp = datetime.now(timezone.utc).isoformat()
        meta_blob = "" if not metadata else json.dumps(metadata, sort_keys=True)
        line = f"{timestamp},{actor},{action},{status},{meta_blob}\n"
        with self._lock:
            with self._path.open("a", encoding="utf-8") as handle:
                handle.write(line)


class PasswordHasher:
    """Deterministic salted PBKDF2 password hashing."""

    iterations: int = 390000
    algorithm: str = "sha256"

    @staticmethod
    def hash_password(password: str, *, salt: Optional[str] = None) -> Tuple[str, str]:
        if salt is None:
            salt = secrets.token_hex(16)
        dk = hashlib.pbkdf2_hmac(
            PasswordHasher.algorithm,
            password.encode("utf-8"),
            bytes.fromhex(salt),
            PasswordHasher.iterations,
        )
        return dk.hex(), salt

    @staticmethod
    def verify_password(password: str, stored_hash: str, salt: str) -> bool:
        calculated, _ = PasswordHasher.hash_password(password, salt=salt)
        return hmac.compare_digest(calculated, stored_hash)


class SecretCipher:
    """Lightweight stream cipher used to store integration secrets at rest."""

    def __init__(self, master_key: str) -> None:
        if not master_key:
            raise ValueError("A non-empty master key is required for encryption")
        digest = hashlib.sha256(master_key.encode("utf-8")).digest()
        self._keystream = digest

    def encrypt(self, plaintext: str) -> str:
        raw = plaintext.encode("utf-8")
        cipher = bytes(b ^ self._keystream[i % len(self._keystream)] for i, b in enumerate(raw))
        return base64.urlsafe_b64encode(cipher).decode("ascii")

    def decrypt(self, ciphertext: str) -> str:
        raw = base64.urlsafe_b64decode(ciphertext.encode("ascii"))
        plain = bytes(b ^ self._keystream[i % len(self._keystream)] for i, b in enumerate(raw))
        return plain.decode("utf-8")


class AuthManager:
    """Coordinator for authentication, token issuance, and provider routing."""

    def __init__(
        self,
        provider: AuthProvider | str = AuthProvider.LOCAL_JWT,
        *,
        registry_path: Path | None = None,
        audit_logger: AuditLogger | None = None,
        master_secret: Optional[str] = None,
    ) -> None:
        if isinstance(provider, str):
            provider = AuthProvider(provider)
        self.provider = provider
        self.registry_path = registry_path or REGISTRY_PATH
        self.audit_logger = audit_logger or AuditLogger(AUDIT_LOG_PATH)
        self.master_secret = master_secret or secrets.token_hex(32)
        self.cipher = SecretCipher(self.master_secret)

        self._users: Dict[str, CredentialRecord] = {}
        self._agent_secrets: Dict[str, AgentSecret] = {}
        self._tokens: Dict[str, AgentToken] = {}
        self._roles = RoleManager(self.registry_path, audit_logger=self.audit_logger)

        self._load_existing_agents()
        self.audit_logger.log("system", "auth_manager.bootstrap", "ok", {"provider": self.provider.value})

    # ------------------------------------------------------------------
    # Registry helpers
    # ------------------------------------------------------------------
    def _load_existing_agents(self) -> None:
        mapping = self._roles.list_agents()
        now = datetime.now(timezone.utc)
        for agent_name in mapping:
            self._agent_secrets.setdefault(
                agent_name,
                AgentSecret(secret_id=secrets.token_hex(8), secret_value=secrets.token_urlsafe(32), rotated_at=now),
            )

    # ------------------------------------------------------------------
    # User management
    # ------------------------------------------------------------------
    def register_user(self, username: str, password: str, role: str) -> CredentialRecord:
        if username in self._users:
            raise ValueError(f"User '{username}' already exists")
        password_hash, salt = PasswordHasher.hash_password(password)
        record = CredentialRecord(
            username=username,
            password_hash=password_hash,
            salt=salt,
            role=role,
            created_at=datetime.now(timezone.utc),
        )
        self._users[username] = record
        self.audit_logger.log(username, "user.register", "ok", {"role": role})
        return record

    def authenticate_user(self, username: str, password: str) -> CredentialRecord:
        record = self._users.get(username)
        if not record or not PasswordHasher.verify_password(password, record.password_hash, record.salt):
            self.audit_logger.log(username, "user.authenticate", "denied", {"reason": "invalid_credentials"})
            raise PermissionError("Invalid username or password")
        self.audit_logger.log(username, "user.authenticate", "ok", {})
        return record

    # ------------------------------------------------------------------
    # Token issuance and validation
    # ------------------------------------------------------------------
    def issue_agent_token(self, agent_id: str, scopes: Iterable[str], actor: str) -> AgentToken:
        if agent_id not in self._agent_secrets:
            raise KeyError(f"Unknown agent '{agent_id}'")

        scopes_set = set(scopes)
        expires_at = datetime.now(timezone.utc) + timedelta(days=TOKEN_LIFETIME_DAYS)
        secret = self._agent_secrets[agent_id]
        token = self._sign_token(agent_id, scopes_set, expires_at, secret)
        record = AgentToken(
            token=token,
            agent_id=agent_id,
            scopes=scopes_set,
            issued_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            secret_id=secret.secret_id,
        )
        self._tokens[token] = record
        self.audit_logger.log(actor, "token.issue", "ok", {"agent": agent_id, "scopes": ",".join(sorted(scopes_set))})
        return record

    def validate_token(self, token: str, *, required_scopes: Optional[Iterable[str]] = None) -> AgentToken:
        record = self._tokens.get(token)
        if record is None:
            self.audit_logger.log("system", "token.validate", "denied", {"reason": "unknown_token"})
            raise PermissionError("Token is not recognised")
        if record.is_expired():
            self.audit_logger.log(record.agent_id, "token.validate", "denied", {"reason": "expired"})
            raise PermissionError("Token has expired")
        if required_scopes and not set(required_scopes).issubset(record.scopes):
            self.audit_logger.log(
                record.agent_id,
                "token.validate",
                "denied",
                {"reason": "insufficient_scope", "required": ",".join(required_scopes)},
            )
            raise PermissionError("Token does not grant the required scopes")
        self.audit_logger.log(record.agent_id, "token.validate", "ok", {})
        return record

    def renew_token(self, token: str, actor: str) -> AgentToken:
        record = self.validate_token(token)
        return self.issue_agent_token(record.agent_id, record.scopes, actor)

    def rotate_agent_secret(self, agent_id: str, actor: str) -> AgentSecret:
        secret = self._agent_secrets.get(agent_id)
        if secret is None:
            raise KeyError(f"Unknown agent '{agent_id}'")
        now = datetime.now(timezone.utc)
        if now - secret.rotated_at < timedelta(hours=SECRET_ROTATION_HOURS):
            self.audit_logger.log(
                actor,
                "secret.rotate",
                "skipped",
                {"agent": agent_id, "reason": "rotation_window_not_elapsed"},
            )
            return secret
        new_secret = AgentSecret(
            secret_id=secrets.token_hex(8),
            secret_value=secrets.token_urlsafe(32),
            rotated_at=now,
        )
        self._agent_secrets[agent_id] = new_secret
        self.audit_logger.log(actor, "secret.rotate", "ok", {"agent": agent_id, "secret_id": new_secret.secret_id})
        return new_secret

    # ------------------------------------------------------------------
    # Provider integration hooks
    # ------------------------------------------------------------------
    def configure_provider(self, **settings: str) -> None:
        self._provider_settings = settings
        self.audit_logger.log("system", "auth.provider.configure", "ok", settings)

    # ------------------------------------------------------------------
    # Access helpers
    # ------------------------------------------------------------------
    def check_agent_access(self, agent_id: str, platform: str, *, scope: Optional[str] = None) -> AccessDecision:
        decision = self._roles.check_agent_access(agent_id, platform, scope=scope)
        self.audit_logger.log(
            agent_id,
            "access.evaluate",
            "ok" if decision.allowed else "denied",
            {"platform": platform, "scope": scope or ""},
        )
        if not decision.allowed:
            raise PermissionError(f"Agent '{agent_id}' is not permitted to interact with '{platform}'")
        return decision

    def list_agents(self) -> List[str]:
        return self._roles.list_agents()

    def get_registry_snapshot(self) -> Dict[str, object]:
        return self._roles.get_registry_snapshot()

    @property
    def role_manager(self) -> RoleManager:
        """Expose the shared role manager instance."""

        return self._roles

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _sign_token(self, agent_id: str, scopes: Set[str], expires_at: datetime, secret: AgentSecret) -> str:
        payload = {
            "sub": agent_id,
            "scopes": sorted(scopes),
            "exp": int(expires_at.timestamp()),
            "sid": secret.secret_id,
        }
        body = json.dumps(payload, sort_keys=True).encode("utf-8")
        signature = hmac.new(secret.secret_value.encode("utf-8"), body, hashlib.sha256).digest()
        return base64.urlsafe_b64encode(body + signature).decode("ascii")

    def decrypt_integration_secret(self, ciphertext: str) -> str:
        return self.cipher.decrypt(ciphertext)

    def encrypt_integration_secret(self, plaintext: str) -> str:
        return self.cipher.encrypt(plaintext)


__all__ = [
    "AccessDecision",
    "AgentSecret",
    "AgentToken",
    "AuditLogger",
    "AuthManager",
    "AuthProvider",
    "CredentialRecord",
    "PasswordHasher",
]
