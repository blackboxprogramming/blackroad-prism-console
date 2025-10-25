"""Base classes and utilities for service connectors."""
from __future__ import annotations

import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests


class ConnectorError(Exception):
    """Custom exception for connector failures."""


@dataclass
class ConnectorResult:
    service_name: str
    success: bool
    status_message: str
    account_name: Optional[str] = None
    active_projects: Optional[int] = None
    error_message: Optional[str] = None


class ConnectorBase(ABC):
    """Base connector with shared retry and token helpers."""

    name: str = "Unknown"
    token_env_var: str = ""
    max_retries: int = 3
    retry_delay: float = 1.0
    timeout: float = 10.0

    def __init__(self) -> None:
        self._session = requests.Session()

    def _get_token(self) -> str:
        token = os.getenv(self.token_env_var)
        if not token:
            raise ConnectorError(
                f"Environment variable {self.token_env_var} is not set."
            )
        return token

    def _request_with_retries(
        self,
        method: str,
        url: str,
        *,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Any] = None,
        data: Optional[Any] = None,
    ) -> Any:
        """Perform an HTTP request with basic retry handling."""
        last_error: Optional[Exception] = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self._session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    json=json,
                    data=data,
                    timeout=self.timeout,
                )
                if response.status_code >= 500 or response.status_code == 429:
                    raise ConnectorError(
                        f"Upstream error {response.status_code}: {response.text[:200]}"
                    )
                if response.status_code >= 400:
                    raise ConnectorError(
                        f"Request failed ({response.status_code}): {response.text[:200]}"
                    )
                if response.headers.get("Content-Type", "").startswith("application/json"):
                    return response.json()
                return response.text
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay * attempt)
                else:
                    break
        raise ConnectorError(str(last_error))

    def sync(self) -> ConnectorResult:
        """Execute the connector flow and package the result."""
        try:
            token = self._get_token()
            account_name, active_projects = self._sync_impl(token)
            return ConnectorResult(
                service_name=self.name,
                success=True,
                status_message="Connected",
                account_name=account_name,
                active_projects=active_projects,
            )
        except ConnectorError as err:
            return ConnectorResult(
                service_name=self.name,
                success=False,
                status_message="Failed",
                error_message=str(err),
            )

    @abstractmethod
    def _sync_impl(self, token: str) -> tuple[str, Optional[int]]:
        """Perform the connector-specific logic."""


__all__ = ["ConnectorBase", "ConnectorResult", "ConnectorError"]
