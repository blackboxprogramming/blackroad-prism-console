"""Dual control approval flow primitives."""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional


class DualControlError(RuntimeError):
    """Raised when a dual-control action cannot be completed."""


@dataclass
class ApprovalRecord:
    """Represents the lifecycle of a dual-control request."""

    approval_id: str
    context: str
    requested_by: str
    created_at: float
    approved_by: Optional[str] = None
    approved_at: Optional[float] = None
    consumed_at: Optional[float] = None
    metadata: Dict[str, str] = field(default_factory=dict)

    @property
    def is_approved(self) -> bool:
        return self.approved_by is not None

    @property
    def is_consumed(self) -> bool:
        return self.consumed_at is not None


class DualControlRegistry:
    """In-memory registry for dual-control approvals."""

    def __init__(self, timeout_seconds: int) -> None:
        self._timeout_seconds = timeout_seconds
        self._records: Dict[str, ApprovalRecord] = {}
        self._lock = asyncio.Lock()

    async def request(self, *, context: str, requested_by: str, metadata: Optional[Dict[str, str]] = None) -> ApprovalRecord:
        """Create a new approval request."""

        approval_id = str(uuid.uuid4())
        record = ApprovalRecord(
            approval_id=approval_id,
            context=context,
            requested_by=requested_by,
            created_at=time.time(),
            metadata=metadata or {},
        )
        async with self._lock:
            self._records[approval_id] = record
        return record

    async def approve(self, approval_id: str, *, approved_by: str) -> ApprovalRecord:
        """Approve an existing request with a different operator."""

        async with self._lock:
            record = self._get_record(approval_id)
            self._ensure_active(record)
            if record.is_approved:
                raise DualControlError("Approval already dual-approved")
            if record.requested_by == approved_by:
                raise DualControlError("Second approver must differ from requester")
            record.approved_by = approved_by
            record.approved_at = time.time()
            return record

    async def consume(self, approval_id: str, *, context: str) -> ApprovalRecord:
        """Mark an approved request as consumed."""

        async with self._lock:
            record = self._get_record(approval_id)
            self._ensure_active(record)
            if record.context != context:
                raise DualControlError("Approval context mismatch")
            if not record.is_approved:
                raise DualControlError("Approval has not been dual-approved yet")
            record.consumed_at = time.time()
            return record

    async def get(self, approval_id: str) -> ApprovalRecord:
        async with self._lock:
            record = self._get_record(approval_id)
            if not record.is_consumed and self._is_expired(record):
                raise DualControlError("Approval expired")
            return record

    def _get_record(self, approval_id: str) -> ApprovalRecord:
        try:
            record = self._records[approval_id]
        except KeyError as exc:
            raise DualControlError("Unknown approval identifier") from exc
        return record

    def _ensure_active(self, record: ApprovalRecord) -> None:
        if record.is_consumed:
            raise DualControlError("Approval already consumed")
        if self._is_expired(record):
            raise DualControlError("Approval expired")

    def _is_expired(self, record: ApprovalRecord) -> bool:
        now = time.time()
        return now - record.created_at > self._timeout_seconds and not record.is_consumed
