"""FastAPI endpoints for policy exceptions."""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from typing import Any, Dict, Optional

import requests
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from policy.exceptions import (
    approval_card,
    approve_exception,
    create_exception,
    deny_exception,
    ensure_schema,
    get_exception,
    load_rule,
    prepend_duplicate_notice,
)

router = APIRouter(prefix="/exceptions", tags=["exceptions"])


def _connect() -> sqlite3.Connection:
    dsn = os.getenv("EXCEPTIONS_DB_PATH", "exceptions.db")
    uri = dsn.startswith("file:")
    conn = sqlite3.connect(dsn, check_same_thread=False, uri=uri)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    return conn


_CONN = _connect()


class ExceptionCreate(BaseModel):
    rule_id: str
    org_id: str
    subject_type: str
    subject_id: str
    reason: str
    requested_by: str
    valid_until: Optional[datetime] = None


class ExceptionResponse(BaseModel):
    id: str
    status: str
    duplicate: bool
    valid_until: Optional[str]


@router.post("/", response_model=ExceptionResponse)
async def create_exception_endpoint(payload: ExceptionCreate) -> Dict[str, Any]:
    record, duplicate = create_exception(
        _CONN,
        rule_id=payload.rule_id,
        org_id=payload.org_id,
        subject_type=payload.subject_type,
        subject_id=payload.subject_id,
        reason=payload.reason,
        requested_by=payload.requested_by,
        valid_until=payload.valid_until,
    )
    if not record:
        raise HTTPException(status_code=500, detail="failed to persist exception")

    card = approval_card(
        payload.rule_id,
        payload.org_id,
        payload.subject_type,
        payload.subject_id,
        payload.reason,
        record.get("valid_until"),
        record["id"],
        payload.requested_by,
    )
    if duplicate:
        prepend_duplicate_notice(card)
    _post_slack(card)

    return {
        "id": record["id"],
        "status": record["status"],
        "duplicate": duplicate,
        "valid_until": record.get("valid_until"),
    }


@router.get("/{exc_id}")
async def get_exception_endpoint(exc_id: str) -> Dict[str, Any]:
    record = get_exception(_CONN, exc_id)
    if not record:
        raise HTTPException(status_code=404, detail="not_found")
    return record


def _parse_datetime(value: str | None) -> Optional[datetime]:
    if not value:
        return None
    text = value.strip()
    if not text:
        return None
    return datetime.fromisoformat(text)


@router.post("/{exc_id}/approve")
async def approve_endpoint(exc_id: str, request: Request) -> Dict[str, Any]:
    form = await request.form()
    actor = form.get("actor")
    valid_until = _parse_datetime(form.get("valid_until"))
    record = approve_exception(
        _CONN,
        exc_id,
        actor=actor,
        valid_until=valid_until,
        slack_user_id=form.get("slack_user_id"),
        message_ts=form.get("message_ts"),
        button=form.get("button"),
    )
    if not record:
        raise HTTPException(status_code=404, detail="not_found")
    _post_owner_update(record, "approved")
    return record


@router.post("/{exc_id}/deny")
async def deny_endpoint(exc_id: str, request: Request) -> Dict[str, Any]:
    form = await request.form()
    actor = form.get("actor")
    record = deny_exception(
        _CONN,
        exc_id,
        actor=actor,
        reason=form.get("reason"),
        slack_user_id=form.get("slack_user_id"),
        message_ts=form.get("message_ts"),
        button=form.get("button"),
    )
    if not record:
        raise HTTPException(status_code=404, detail="not_found")
    _post_owner_update(record, "denied")
    return record


def _post_slack(card: Dict[str, Any]) -> None:
    token = os.getenv("SLACK_BOT_TOKEN")
    channel = os.getenv("SECOPS_CHANNEL")
    if not token or not channel:
        return
    body = dict(card)
    body["channel"] = channel
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json; charset=utf-8",
    }
    try:
        resp = requests.post("https://slack.com/api/chat.postMessage", json=body, headers=headers, timeout=5)
        resp.raise_for_status()
    except Exception:  # pragma: no cover - network best effort
        pass


def _post_owner_update(record: Dict[str, Any], decision: str) -> None:
    token = os.getenv("SLACK_BOT_TOKEN")
    channel = os.getenv("SECOPS_CHANNEL")
    if not token or not channel:
        return
    try:
        spec = load_rule(record["rule_id"])
    except KeyError:  # pragma: no cover - defensive
        return
    owners = ", ".join(spec.owners) if spec.owners else "owners"
    text = (
        f":bell: Exception `{record['id']}` for rule `{record['rule_id']}` was {decision}"
        f" by *{record.get('decided_by') or 'unknown'}*."
        f" Notifying {owners}."
    )
    body = {"channel": channel, "text": text}
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json; charset=utf-8",
    }
    try:
        requests.post("https://slack.com/api/chat.postMessage", json=body, headers=headers, timeout=5)
    except Exception:  # pragma: no cover - best effort
        pass
