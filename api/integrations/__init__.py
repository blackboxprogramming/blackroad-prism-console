"""Platform integration clients with role-aware access controls."""

from __future__ import annotations

import json
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Mapping, Optional

from ..auth import AuthManager
from ..roles import RoleManager

PROJECT_ROOT = Path(__file__).resolve().parents[2]
KEYS_PATH = PROJECT_ROOT / "configs" / "keys.env"


class IntegrationError(RuntimeError):
    """Raised when a platform call cannot be completed."""


@dataclass
class PlatformDefinition:
    name: str
    base_url: str
    permissions: Iterable[str]
    endpoints: Iterable[str]


class KeyStore:
    """Reads and decrypts integration secrets from the shared environment file."""

    def __init__(self, path: Path | None = None, *, auth_manager: Optional[AuthManager] = None) -> None:
        self.path = path or KEYS_PATH
        self.auth_manager = auth_manager
        self._cache: Dict[str, str] = {}
        self.reload()

    def reload(self) -> None:
        self._cache = {}
        if not self.path.exists():
            return
        content = self.path.read_text(encoding="utf-8")
        for line in content.splitlines():
            if not line or line.strip().startswith("#"):
                continue
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if self.auth_manager is not None:
                try:
                    value = self.auth_manager.decrypt_integration_secret(value)
                except Exception:  # pragma: no cover - corrupted secrets should not break boot
                    pass
            self._cache[key] = value

    def get(self, agent: str, platform: str) -> Optional[str]:
        candidate_keys = [
            f"{agent.upper()}_{platform.upper()}_TOKEN",
            f"{agent.upper()}_{platform.upper()}",
            f"{platform.upper()}_{agent.upper()}",
        ]
        for key in candidate_keys:
            if key in self._cache:
                return self._cache[key]
        return None


class PlatformClient:
    """HTTP wrapper that enforces role-based access before performing a call."""

    def __init__(
        self,
        platform: str,
        definition: PlatformDefinition,
        *,
        role_manager: RoleManager,
        auth_manager: AuthManager,
        key_store: KeyStore,
    ) -> None:
        self.platform = platform
        self.definition = definition
        self.role_manager = role_manager
        self.auth_manager = auth_manager
        self.key_store = key_store

    def _build_request(self, endpoint: str, token: str, payload: Optional[Mapping[str, object]], method: str) -> urllib.request.Request:
        url = self.definition.base_url + endpoint
        data = None
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(url, data=data, method=method.upper(), headers=headers)
        return request

    def call(
        self,
        *,
        agent: str,
        endpoint: str,
        method: str = "POST",
        payload: Optional[Mapping[str, object]] = None,
        scope: Optional[str] = None,
    ) -> bytes:
        self.auth_manager.check_agent_access(agent, self.platform, scope=scope)
        token = self.key_store.get(agent, self.platform)
        if not token:
            raise IntegrationError(f"No credentials configured for {agent}:{self.platform}")
        request = self._build_request(endpoint, token, payload, method)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read()
        except OSError as exc:  # pragma: no cover - network failures are environment specific
            raise IntegrationError(str(exc)) from exc


class IntegrationManager:
    """Factory for platform clients with unified access checks."""

    def __init__(
        self,
        auth_manager: AuthManager,
        *,
        role_manager: RoleManager | None = None,
        key_store: KeyStore | None = None,
    ) -> None:
        self.auth_manager = auth_manager
        self.role_manager = role_manager or auth_manager.role_manager
        self.key_store = key_store or KeyStore(auth_manager=auth_manager)
        self._definitions: Dict[str, PlatformDefinition] = {
            "github": PlatformDefinition(
                name="github",
                base_url="https://api.github.com",
                permissions=("repo_read", "repo_write", "action_trigger"),
                endpoints=("/api/github/push", "/api/github/pr"),
            ),
            "huggingface": PlatformDefinition(
                name="huggingface",
                base_url="https://huggingface.co",
                permissions=("model_create", "model_push", "space_deploy"),
                endpoints=("/api/hf/publish",),
            ),
            "slack": PlatformDefinition(
                name="slack",
                base_url="https://slack.com",
                permissions=("message_post", "thread_reply"),
                endpoints=("/api/slack/post",),
            ),
            "notion": PlatformDefinition(
                name="notion",
                base_url="https://api.notion.com",
                permissions=("db_read", "db_write", "comment"),
                endpoints=("/api/notion/update",),
            ),
            "linear": PlatformDefinition(
                name="linear",
                base_url="https://api.linear.app",
                permissions=("issue_create", "status_update"),
                endpoints=("/api/linear/task",),
            ),
            "dropbox": PlatformDefinition(
                name="dropbox",
                base_url="https://api.dropboxapi.com",
                permissions=("file_upload", "link_share"),
                endpoints=("/api/dropbox/store",),
            ),
        }

    def get_client(self, platform: str) -> PlatformClient:
        definition = self._definitions.get(platform)
        if not definition:
            raise KeyError(f"Unknown platform '{platform}'")
        return PlatformClient(
            platform,
            definition,
            role_manager=self.role_manager,
            auth_manager=self.auth_manager,
            key_store=self.key_store,
        )


__all__ = ["IntegrationError", "IntegrationManager", "KeyStore", "PlatformClient", "PlatformDefinition"]
