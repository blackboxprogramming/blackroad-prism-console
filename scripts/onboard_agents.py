"""Automated onboarding workflow for Codex deployment agents.

This script coordinates credential verification, agent registration,
platform linking, and status reporting.  It consumes the declarative
registry under ``registry/agent_roles.json`` and produces
``registry/platform_connections.json`` as well as a log stream at
``logs/deployment.log``.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import secrets
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional
import urllib.error
import urllib.request

# Ensure the repository root is importable when the script runs directly.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

REGISTRY_DIR = ROOT / "registry"
AGENT_ROLE_PATH = REGISTRY_DIR / "agent_roles.json"
PLATFORM_CONNECTIONS_PATH = REGISTRY_DIR / "platform_connections.json"
LOG_PATH = ROOT / "logs" / "deployment.log"
SECRET_EXPORT_DIR = ROOT / "secrets" / "onboarding"

# Minimum platform credential length chosen to approximate 96 bits of entropy.
MIN_TOKEN_LENGTH = 12
ONBOARDING_TOKEN_ENV = "ONBOARDING_REGISTRATION_TOKEN"
ONBOARDING_AUTH_HEADER = "X-Onboarding-Token"

STATUS_MESSAGES = {
    "connected": "connected",
    "expired": "key expired",
    "missing_credentials": "credentials missing",
    "invalid": "credential check failed",
}


@dataclass
class PlatformSpec:
    """Declarative configuration for a single platform integration."""

    name: str
    integration_id: str
    credential_env: str
    scopes: List[str]
    test_token: Optional[str]
    expires_at: Optional[datetime]


@dataclass
class AgentSpec:
    """Agent metadata sourced from ``agent_roles.json``."""

    name: str
    role: str
    email: str
    platforms: List[PlatformSpec]


@dataclass
class PlatformStatus:
    """Result of verifying a platform credential during onboarding."""

    name: str
    integration_id: str
    status: str
    scopes: List[str]
    credential_source: str
    last_verified: datetime
    details: Optional[str] = None

    def payload(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "integration_id": self.integration_id,
            "status": self.status,
            "scopes": self.scopes,
            "credential_source": self.credential_source,
            "verified_at": self.last_verified.isoformat().replace("+00:00", "Z"),
            "details": self.details,
        }


@dataclass
class AgentResult:
    """Aggregate onboarding output for a single agent."""

    name: str
    role: str
    email: str
    key_id: str
    key_fingerprint: str
    permissions: List[str]
    platforms: List[PlatformStatus]

    def registration_payload(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "role": self.role,
            "email": self.email,
            "key_id": self.key_id,
            "key_fingerprint": self.key_fingerprint,
            "permissions": self.permissions,
            "platforms": [platform.payload() for platform in self.platforms],
        }


def configure_logging() -> None:
    """Wire log output to both stdout and the deployment log file."""

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    handlers = [logging.StreamHandler(sys.stdout), logging.FileHandler(LOG_PATH)]
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=handlers,
    )


def load_agent_registry(path: Path) -> tuple[Mapping[str, Any], List[AgentSpec]]:
    """Load and validate the agent role manifest."""

    if not path.exists():
        raise FileNotFoundError(f"Agent role registry not found at {path}")

    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    roles: Mapping[str, Any] = payload.get("roles", {})
    agent_specs: List[AgentSpec] = []

    for agent_entry in payload.get("agents", []):
        platforms: List[PlatformSpec] = []
        for platform_entry in agent_entry.get("platforms", []):
            expires_raw = platform_entry.get("expires_at")
            expires_at = None
            if isinstance(expires_raw, str) and expires_raw:
                expires_at = parse_timestamp(expires_raw)
            platforms.append(
                PlatformSpec(
                    name=platform_entry["name"],
                    integration_id=platform_entry.get("integration_id", platform_entry["name"].lower()),
                    credential_env=platform_entry.get("credential_env", ""),
                    scopes=list(platform_entry.get("scopes", [])),
                    test_token=platform_entry.get("test_token"),
                    expires_at=expires_at,
                )
            )
        agent_specs.append(
            AgentSpec(
                name=agent_entry["name"],
                role=agent_entry["role"],
                email=agent_entry.get("email", ""),
                platforms=platforms,
            )
        )

    return roles, agent_specs


def parse_timestamp(value: str) -> datetime:
    """Parse ISO-8601 timestamps that may include a ``Z`` suffix."""

    if value.endswith("Z"):
        value = value[:-1]
    return datetime.fromisoformat(value).replace(tzinfo=timezone.utc)


def resolve_role_permissions(role: str, roles: Mapping[str, Any]) -> List[str]:
    """Expand a role definition into platform-scope permission strings."""

    role_info = roles.get(role, {})
    scopes: MutableMapping[str, Iterable[str]] = role_info.get("scopes", {})
    permissions: List[str] = []
    for platform, platform_scopes in scopes.items():
        for scope in platform_scopes:
            permissions.append(f"{platform}:{scope}")
    return sorted(set(permissions))


def generate_api_keypair(agent_name: str) -> tuple[str, str, str]:
    """Generate a unique API keypair and a safe-to-log fingerprint."""

    key_id = secrets.token_hex(8)
    secret = secrets.token_urlsafe(32)
    fingerprint = hashlib.sha256(f"{agent_name}:{secret}".encode("utf-8")).hexdigest()[:32]
    return key_id, secret, fingerprint


def persist_generated_secret(agent_name: str, key_id: str, secret: str) -> Path:
    """Persist a generated secret to the onboarding secrets directory."""

    SECRET_EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^a-zA-Z0-9_-]", "_", agent_name.lower()) or "agent"
    path = SECRET_EXPORT_DIR / f"{safe_name}.json"
    record = {
        "agent": agent_name,
        "key_id": key_id,
        "secret": secret,
        "generated_at": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    with path.open("w", encoding="utf-8") as handle:
        json.dump(record, handle, indent=2)
    try:
        os.chmod(path, 0o600)
    except OSError:
        logging.warning("Unable to adjust permissions for %s", path)
    return path


def verify_platform_credentials(platform: PlatformSpec) -> PlatformStatus:
    """Perform lightweight verification of credentials for a platform."""

    now = datetime.now(tz=timezone.utc)
    raw_token = os.environ.get(platform.credential_env)
    credential_source = "env" if raw_token else "seed"
    if not raw_token:
        raw_token = platform.test_token

    status = "connected"
    details: Optional[str] = None

    if not raw_token:
        status = "missing_credentials"
        credential_source = "unavailable"
        details = "No credential found in environment or seed data."
    elif platform.expires_at and platform.expires_at < now:
        status = "expired"
        details = f"Token expired at {platform.expires_at.isoformat().replace('+00:00', 'Z')}"
    elif len(raw_token) < MIN_TOKEN_LENGTH:
        status = "invalid"
        details = "Token too short to satisfy basic validity heuristics."

    logging.info(
        "[%s] %s credential check → %s",
        platform.integration_id,
        platform.name,
        status,
    )
    return PlatformStatus(
        name=platform.name,
        integration_id=platform.integration_id,
        status=status,
        scopes=platform.scopes,
        credential_source=credential_source,
        last_verified=now,
        details=details,
    )


def register_agent(payload: Mapping[str, Any]) -> Mapping[str, Any]:
    """Register the agent either via HTTP or the local FastAPI handler."""

    api_root = os.environ.get("ONBOARDING_API_URL")
    if api_root:
        url = f"{api_root.rstrip('/')}/auth/register_agent"
        try:
            headers = {"Content-Type": "application/json"}
            api_token = os.environ.get(ONBOARDING_TOKEN_ENV)
            if api_token:
                headers[ONBOARDING_AUTH_HEADER] = api_token
            request = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(request, timeout=10) as response:
                body = response.read().decode("utf-8")
            return json.loads(body)
        except json.JSONDecodeError as exc:  # pragma: no cover - network optional
            logging.warning(
                "Remote registration at %s returned invalid JSON: %s", url, exc
            )
        except urllib.error.URLError as exc:  # pragma: no cover - network optional
            logging.warning("Remote registration at %s failed: %s", url, exc)

    try:
        from api.auth.register_agent import register_agent as local_register
    except Exception as exc:  # pragma: no cover - import errors surface loudly
        logging.error("Unable to import local register_agent handler: %s", exc)
        raise

    return local_register(payload)


def compile_summary(results: List[AgentResult]) -> str:
    """Generate a human-readable summary of onboarding outcomes."""

    lines: List[str] = []
    for result in results:
        statuses = result.platforms
        if statuses and all(status.status == "connected" for status in statuses):
            platforms_linked = " + ".join(status.name for status in statuses)
            lines.append(f"✅ {result.name} — {platforms_linked} linked")
            continue

        issues: List[str] = []
        emoji = "❌"
        for status in statuses:
            if status.status != "connected":
                message = STATUS_MESSAGES.get(status.status, status.status)
                issues.append(f"{status.name} {message}")
                if status.status == "expired":
                    emoji = "⚠️"
        if not statuses:
            issues.append("no integrations configured")
        lines.append(f"{emoji} {result.name} — {', '.join(issues)}")
    return "\n".join(lines)


def write_platform_registry(payload: Mapping[str, Any]) -> None:
    """Persist the aggregated platform connection registry."""

    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    with PLATFORM_CONNECTIONS_PATH.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def main() -> None:
    configure_logging()
    logging.info("Starting agent onboarding pipeline")

    roles, agents = load_agent_registry(AGENT_ROLE_PATH)
    logging.info("Loaded %d agent definitions", len(agents))

    results: List[AgentResult] = []

    for agent in agents:
        key_id, secret, fingerprint = generate_api_keypair(agent.name)
        logging.info("Generated credential set for %s (key id %s)", agent.name, key_id)
        # Secret is intentionally not logged beyond this point; a real deployment
        # would store it in a vault. Here we persist the secret for operators and
        # retain the fingerprint for auditing.

        secret_path = persist_generated_secret(agent.name, key_id, secret)
        logging.info("Stored API secret for %s at %s", agent.name, secret_path)

        permissions = resolve_role_permissions(agent.role, roles)
        platform_statuses: List[PlatformStatus] = [
            verify_platform_credentials(platform) for platform in agent.platforms
        ]

        agent_result = AgentResult(
            name=agent.name,
            role=agent.role,
            email=agent.email,
            key_id=key_id,
            key_fingerprint=fingerprint,
            permissions=permissions,
            platforms=platform_statuses,
        )
        payload = agent_result.registration_payload()

        response = register_agent(payload)
        logging.info("Registered %s with status %s", agent.name, response.get("status"))
        results.append(agent_result)

    registry_snapshot = {
        "generated_at": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
        "agents": [result.registration_payload() for result in results],
    }
    write_platform_registry(registry_snapshot)

    summary = compile_summary(results)
    logging.info("Onboarding summary ready")
    for line in summary.splitlines():
        logging.info("SUMMARY %s", line)
    print(summary)


if __name__ == "__main__":
    main()
