"""Environment access request and approval primitives."""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional


class EnvironmentControlError(RuntimeError):
    """Raised when an environment control action cannot be completed."""


@dataclass
class EnvironmentAccessRecord:
    """Represents the lifecycle of an environment access request."""

    request_id: str
    environment_name: str
    requested_by: str
    purpose: str
    duration_minutes: int
    created_at: float
    approved_by: Optional[str] = None
    granted_at: Optional[float] = None
    expires_at: Optional[float] = None
    metadata: Dict[str, str] = field(default_factory=dict)

    @property
    def is_approved(self) -> bool:
        return self.approved_by is not None

    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return time.time() > self.expires_at

    @property
    def is_active(self) -> bool:
        return self.is_approved and not self.is_expired


class EnvironmentRegistry:
    """In-memory registry for environment access requests."""

    def __init__(self, request_timeout_seconds: int = 900) -> None:
        self._request_timeout_seconds = request_timeout_seconds
        self._records: Dict[str, EnvironmentAccessRecord] = {}
        self._lock = asyncio.Lock()

    async def request(
        self,
        *,
        environment_name: str,
        requested_by: str,
        purpose: str,
        duration_minutes: int,
        metadata: Optional[Dict[str, str]] = None,
    ) -> EnvironmentAccessRecord:
        """Create a new environment access request."""

        request_id = str(uuid.uuid4())
        record = EnvironmentAccessRecord(
            request_id=request_id,
            environment_name=environment_name,
            requested_by=requested_by,
            purpose=purpose,
            duration_minutes=duration_minutes,
            created_at=time.time(),
            metadata=metadata or {},
        )
        async with self._lock:
            self._records[request_id] = record
        return record

    async def approve(self, request_id: str, *, approved_by: str) -> EnvironmentAccessRecord:
        """Approve an environment access request with a different operator."""

        async with self._lock:
            record = self._get_record(request_id)
            self._ensure_pending(record)
            if record.is_approved:
                raise EnvironmentControlError("Request already approved")
            if record.requested_by == approved_by:
                raise EnvironmentControlError("Approver must differ from requester")

            now = time.time()
            record.approved_by = approved_by
            record.granted_at = now
            record.expires_at = now + (record.duration_minutes * 60)
            return record

    async def get(self, request_id: str) -> EnvironmentAccessRecord:
        async with self._lock:
            record = self._get_record(request_id)
            if not record.is_approved and self._is_request_expired(record):
                raise EnvironmentControlError("Request expired")
            return record

    def _get_record(self, request_id: str) -> EnvironmentAccessRecord:
        try:
            record = self._records[request_id]
        except KeyError as exc:
            raise EnvironmentControlError("Unknown request identifier") from exc
        return record

    def _ensure_pending(self, record: EnvironmentAccessRecord) -> None:
        if self._is_request_expired(record):
            raise EnvironmentControlError("Request expired")

    def _is_request_expired(self, record: EnvironmentAccessRecord) -> bool:
        """Check if the request itself (not the granted access) has expired."""
        if record.is_approved:
            return False
        now = time.time()
        return now - record.created_at > self._request_timeout_seconds
