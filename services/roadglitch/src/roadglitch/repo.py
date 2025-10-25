from __future__ import annotations

import datetime as dt
import hashlib
import json
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional


@dataclass
class WorkflowRecord:
    id: int
    name: str
    version: str
    spec: str
    spec_digest: str
    created_at: dt.datetime
    updated_at: dt.datetime


@dataclass
class RunRecord:
    id: int
    workflow_id: int
    status: str
    input_payload: str
    result_payload: Optional[str]
    created_at: dt.datetime
    updated_at: dt.datetime
    idempotency_key: Optional[str]


@dataclass
class RunLogRecord:
    run_id: int
    sequence: int
    message: str
    created_at: dt.datetime


@dataclass
class IdempotencyRecord:
    key: str
    run_id: int
    payload_hash: str
    created_at: dt.datetime


class Database:
    def __init__(self) -> None:
        self.workflows: Dict[int, WorkflowRecord] = {}
        self.runs: Dict[int, RunRecord] = {}
        self.run_logs: Dict[int, List[RunLogRecord]] = {}
        self.idempotency: Dict[str, IdempotencyRecord] = {}
        self._workflow_seq = 0
        self._run_seq = 0


def _digest_spec(spec: str) -> str:
    return hashlib.sha256(spec.encode("utf-8")).hexdigest()


class WorkflowRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    def upsert(self, *, name: str, version: str, spec: str) -> WorkflowRecord:
        digest = _digest_spec(spec)
        for workflow in self._db.workflows.values():
            if workflow.name == name and workflow.version == version:
                workflow.spec = spec
                workflow.spec_digest = digest
                workflow.updated_at = dt.datetime.utcnow()
                return workflow
        self._db._workflow_seq += 1
        record = WorkflowRecord(
            id=self._db._workflow_seq,
            name=name,
            version=version,
            spec=spec,
            spec_digest=digest,
            created_at=dt.datetime.utcnow(),
            updated_at=dt.datetime.utcnow(),
        )
        self._db.workflows[record.id] = record
        return record

    def get(self, workflow_id: int) -> Optional[WorkflowRecord]:
        return self._db.workflows.get(workflow_id)

    def get_by_name_version(self, name: str, version: str) -> Optional[WorkflowRecord]:
        for workflow in self._db.workflows.values():
            if workflow.name == name and workflow.version == version:
                return workflow
        return None

    def list(self, *, limit: int = 50, offset: int = 0) -> List[WorkflowRecord]:
        return list(self._db.workflows.values())[offset : offset + limit]


class RunRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    def create(self, *, workflow_id: int, input_payload: str, idempotency_key: str | None) -> RunRecord:
        self._db._run_seq += 1
        record = RunRecord(
            id=self._db._run_seq,
            workflow_id=workflow_id,
            status="queued",
            input_payload=input_payload,
            result_payload=None,
            created_at=dt.datetime.utcnow(),
            updated_at=dt.datetime.utcnow(),
            idempotency_key=idempotency_key,
        )
        self._db.runs[record.id] = record
        return record

    def update_status(self, run_id: int, status: str, result_payload: str | None = None) -> None:
        record = self._db.runs.get(run_id)
        if not record:
            return
        record.status = status
        record.updated_at = dt.datetime.utcnow()
        if result_payload is not None:
            record.result_payload = result_payload

    def get(self, run_id: int) -> Optional[RunRecord]:
        return self._db.runs.get(run_id)

    def list_logs(self, run_id: int, *, limit: int = 100, offset: int = 0) -> List[RunLogRecord]:
        logs = self._db.run_logs.get(run_id, [])
        return logs[offset : offset + limit]

    def append_logs(self, run_id: int, messages: Iterable[str]) -> None:
        logs = self._db.run_logs.setdefault(run_id, [])
        sequence = logs[-1].sequence if logs else 0
        for msg in messages:
            sequence += 1
            logs.append(
                RunLogRecord(
                    run_id=run_id,
                    sequence=sequence,
                    message=msg,
                    created_at=dt.datetime.utcnow(),
                )
            )

    def upsert_idempotency(self, key: str, payload: dict, run_id: int) -> IdempotencyRecord:
        payload_hash = _digest_spec(json.dumps(payload, sort_keys=True))
        if key in self._db.idempotency:
            return self._db.idempotency[key]
        record = IdempotencyRecord(
            key=key,
            run_id=run_id,
            payload_hash=payload_hash,
            created_at=dt.datetime.utcnow(),
        )
        self._db.idempotency[key] = record
        return record

    def find_by_idempotency(self, key: str) -> Optional[RunRecord]:
        record = self._db.idempotency.get(key)
        if not record:
            return None
        return self._db.runs.get(record.run_id)


__all__ = ["Database", "WorkflowRepository", "RunRepository"]

