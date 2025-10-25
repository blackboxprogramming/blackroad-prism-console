from __future__ import annotations

import datetime as dt
from typing import Optional

from sqlmodel import Field, SQLModel


class Workflow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    version: str = Field(index=True)
    spec: str
    spec_digest: str
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.utcnow())
    updated_at: dt.datetime = Field(default_factory=lambda: dt.datetime.utcnow())


class Run(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workflow_id: int = Field(index=True)
    status: str = Field(default="queued", index=True)
    input_payload: str
    result_payload: Optional[str] = None
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.utcnow())
    updated_at: dt.datetime = Field(default_factory=lambda: dt.datetime.utcnow())
    idempotency_key: Optional[str] = Field(default=None, index=True)


class RunLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: int = Field(index=True)
    sequence: int = Field(index=True)
    message: str
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.utcnow())


class IdempotencyKey(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True, unique=True)
    run_id: int = Field(index=True)
    payload_hash: str
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.utcnow())


__all__ = ["Workflow", "Run", "RunLog", "IdempotencyKey"]

