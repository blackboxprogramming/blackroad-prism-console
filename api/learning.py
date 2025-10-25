"""Learning & Adaptation Layer API for the BlackRoad Collective."""
from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator

ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = ROOT / "logs"
DATA_DIR = ROOT / "data"
REPORT_DIR = ROOT / "reports" / "learning"
REGISTRY_DIR = ROOT / "registry" / "memory_summaries"
STATE_PATH = LOG_DIR / "learning_state.json"
EVENTS_LOG = LOG_DIR / "learning_events.jsonl"
AUDIT_LOG = LOG_DIR / "learning_audit.jsonl"

for directory in (LOG_DIR, DATA_DIR, REPORT_DIR, REGISTRY_DIR):
    directory.mkdir(parents=True, exist_ok=True)

if not DATA_DIR.joinpath("features.parquet").exists():
    DATA_DIR.joinpath("features.parquet").write_text("# placeholder feature store; populated by learning tasks\n")

app = FastAPI(title="BlackRoad Learning Layer", version="0.1.0")


class LearningProposalRequest(BaseModel):
    """Payload describing a learning proposal submitted by an agent."""

    agent: str = Field(..., description="Agent submitting the change proposal.")
    change_type: str = Field(..., description="Type of learning change (prompt_patch, tool_policy, finetune_model).")
    title: str = Field(..., description="Human readable summary of the change.")
    description: Optional[str] = Field(None, description="Detailed rationale for the change.")
    diff: Optional[str] = Field(
        None,
        description="Unified diff or patch capturing the prompt/config delta.",
    )
    diff_uri: Optional[str] = Field(
        None,
        description="URI pointing at a stored diff artifact.",
    )
    learning_modes: List[str] = Field(default_factory=list, description="Learning toggles active for this proposal.")
    signals: Dict[str, float] = Field(
        default_factory=dict,
        description="Normalized [-1,1] impact signals motivating the proposal.",
    )
    tags: List[str] = Field(default_factory=list, description="Arbitrary proposal tags (eg: nightly, regression).")

    @validator("learning_modes", each_item=True)
    def _strip_mode(cls, value: str) -> str:  # noqa: D401
        """Normalize whitespace for learning modes."""

        return value.strip()


class LearningProposalResponse(BaseModel):
    """Response describing a stored learning proposal."""

    id: str
    status: str
    agent: str
    change_type: str
    title: str
    description: Optional[str]
    diff: Optional[str]
    diff_uri: Optional[str]
    learning_modes: List[str]
    signals: Dict[str, float]
    tags: List[str]
    submitted_at: datetime
    updated_at: datetime
    approvals: List[Dict[str, Any]]
    audit_ref: str


class LearningApprovalRequest(BaseModel):
    """Request payload for approving or rejecting a proposal."""

    proposal_id: str
    reviewer: str
    decision: str = Field(..., regex="^(approve|reject)$")
    notes: Optional[str] = None


class LearningApplyRequest(BaseModel):
    """Request payload for applying an approved change."""

    proposal_id: str
    applier: str
    rationale: Optional[str] = None
    result: Optional[str] = Field(
        None,
        description="Outcome summary (eg: tests_passed, rollback_triggered).",
    )


class LearningRollbackRequest(BaseModel):
    """Request payload for reverting an applied change."""

    change_id: str
    requester: str
    reason: Optional[str] = None


class FinetuneRequest(BaseModel):
    """Request payload for scheduling a PEFT fine-tuning job."""

    agent: str
    dataset: str
    run_id: Optional[str] = None
    notes: Optional[str] = None


class LearningStatusResponse(BaseModel):
    """Aggregated state used by the UI dashboard."""

    proposals: List[LearningProposalResponse]
    xp: Dict[str, Dict[str, float]]
    open_proposals: int
    last_updated: datetime
    recent_events: List[Dict[str, Any]]


def _load_state() -> Dict[str, Any]:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text())
    return {"proposals": [], "xp": {}, "applied": [], "rollbacks": []}


def _save_state(state: Dict[str, Any]) -> None:
    STATE_PATH.write_text(json.dumps(state, default=str, indent=2))


def _append_jsonl(path: Path, payload: Dict[str, Any]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = dict(payload)
    payload.setdefault("ts", datetime.utcnow().isoformat())
    line = json.dumps(payload)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(f"{line}\n")
    return payload["ts"]


def _update_xp(state: Dict[str, Any], agent: str, *, craft: float = 0.0, empathy: float = 0.0,
               reliability: float = 0.0, velocity: float = 0.0, stewardship: float = 0.0) -> None:
    scoreboard = state.setdefault("xp", {})
    agent_scores = scoreboard.setdefault(
        agent,
        {"craft": 0.0, "empathy": 0.0, "reliability": 0.0, "velocity": 0.0, "stewardship": 0.0, "level": 0},
    )
    agent_scores["craft"] += craft
    agent_scores["empathy"] += empathy
    agent_scores["reliability"] += reliability
    agent_scores["velocity"] += velocity
    agent_scores["stewardship"] += stewardship
    agent_scores["level"] = _level_for(agent_scores)


_LEVEL_THRESHOLDS = [10, 25, 50, 100, 200]


def _level_for(scores: Dict[str, float]) -> int:
    total = sum(scores.get(metric, 0.0) for metric in ("craft", "empathy", "reliability", "velocity", "stewardship"))
    level = 1
    for idx, threshold in enumerate(_LEVEL_THRESHOLDS, start=2):
        if total >= threshold:
            level = idx
        else:
            break
    return level


def _proposal_to_model(proposal: Dict[str, Any]) -> LearningProposalResponse:
    return LearningProposalResponse(
        id=proposal["id"],
        status=proposal["status"],
        agent=proposal["agent"],
        change_type=proposal["change_type"],
        title=proposal["title"],
        description=proposal.get("description"),
        diff=proposal.get("diff"),
        diff_uri=proposal.get("diff_uri"),
        learning_modes=list(proposal.get("learning_modes", [])),
        signals=dict(proposal.get("signals", {})),
        tags=list(proposal.get("tags", [])),
        submitted_at=datetime.fromisoformat(proposal["submitted_at"]),
        updated_at=datetime.fromisoformat(proposal["updated_at"]),
        approvals=list(proposal.get("approvals", [])),
        audit_ref=proposal["audit_ref"],
    )


def _recent_events(limit: int = 25) -> List[Dict[str, Any]]:
    if not EVENTS_LOG.exists():
        return []
    lines = EVENTS_LOG.read_text().strip().splitlines()
    events: List[Dict[str, Any]] = []
    for line in reversed(lines[-limit:]):
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    events.sort(key=lambda item: item.get("ts", ""), reverse=True)
    return events[:limit]


@app.post("/learning/propose", response_model=LearningProposalResponse)
def propose_change(payload: LearningProposalRequest) -> LearningProposalResponse:
    """Store a new learning change proposal and emit audit records."""

    state = _load_state()
    proposal_id = uuid.uuid4().hex
    now = datetime.utcnow().isoformat()
    audit_ref = uuid.uuid4().hex
    proposal = {
        "id": proposal_id,
        "status": "pending",
        "agent": payload.agent,
        "change_type": payload.change_type,
        "title": payload.title,
        "description": payload.description,
        "diff": payload.diff,
        "diff_uri": payload.diff_uri,
        "learning_modes": payload.learning_modes,
        "signals": payload.signals,
        "tags": payload.tags,
        "submitted_at": now,
        "updated_at": now,
        "approvals": [],
        "audit_ref": audit_ref,
    }
    state.setdefault("proposals", []).append(proposal)
    _update_xp(state, payload.agent, stewardship=1.0)
    _save_state(state)
    _append_jsonl(
        EVENTS_LOG,
        {
            "ts": now,
            "event": "proposal_created",
            "agent": payload.agent,
            "proposal_id": proposal_id,
            "change_type": payload.change_type,
        },
    )
    _append_jsonl(
        AUDIT_LOG,
        {
            "ts": now,
            "agent": payload.agent,
            "change_type": payload.change_type,
            "audit_ref": audit_ref,
            "status": "pending",
            "title": payload.title,
        },
    )
    return _proposal_to_model(proposal)


@app.post("/learning/approve", response_model=LearningProposalResponse)
def approve_change(payload: LearningApprovalRequest) -> LearningProposalResponse:
    """Approve or reject a proposal, respecting governance requirements."""

    state = _load_state()
    proposals = state.get("proposals", [])
    for proposal in proposals:
        if proposal["id"] == payload.proposal_id:
            decision_record = {
                "reviewer": payload.reviewer,
                "decision": payload.decision,
                "notes": payload.notes,
                "ts": datetime.utcnow().isoformat(),
            }
            proposal.setdefault("approvals", []).append(decision_record)
            if payload.decision == "approve":
                proposal["status"] = "approved"
            else:
                proposal["status"] = "rejected"
            proposal["updated_at"] = decision_record["ts"]
            _save_state(state)
            _append_jsonl(
                AUDIT_LOG,
                {
                    "agent": proposal["agent"],
                    "change_type": proposal["change_type"],
                    "audit_ref": proposal["audit_ref"],
                    "status": proposal["status"],
                    "reviewer": payload.reviewer,
                    "decision": payload.decision,
                },
            )
            _append_jsonl(
                EVENTS_LOG,
                {
                    "event": f"proposal_{proposal['status']}",
                    "proposal_id": proposal["id"],
                    "agent": proposal["agent"],
                },
            )
            if payload.decision == "approve":
                _update_xp(state, proposal["agent"], craft=2.0, reliability=1.0)
            else:
                _update_xp(state, proposal["agent"], reliability=-0.5)
            _save_state(state)
            return _proposal_to_model(proposal)
    raise HTTPException(status_code=404, detail="proposal not found")


@app.post("/learning/apply", response_model=LearningProposalResponse)
def apply_change(payload: LearningApplyRequest) -> LearningProposalResponse:
    """Mark an approved change as applied and record XP."""

    state = _load_state()
    proposals = state.get("proposals", [])
    for proposal in proposals:
        if proposal["id"] == payload.proposal_id:
            if proposal["status"] != "approved":
                raise HTTPException(status_code=400, detail="proposal must be approved before applying")
            proposal["status"] = "applied"
            ts = datetime.utcnow().isoformat()
            proposal["updated_at"] = ts
            state.setdefault("applied", []).append(
                {
                    "proposal_id": proposal["id"],
                    "applier": payload.applier,
                    "rationale": payload.rationale,
                    "result": payload.result,
                    "ts": ts,
                }
            )
            velocity_delta = 2.0
            reliability_delta = 1.0 if payload.result == "tests_passed" else 0.5
            _update_xp(
                state,
                proposal["agent"],
                craft=1.0,
                reliability=reliability_delta,
                velocity=velocity_delta,
            )
            _save_state(state)
            _append_jsonl(
                EVENTS_LOG,
                {
                    "event": "proposal_applied",
                    "proposal_id": proposal["id"],
                    "agent": proposal["agent"],
                    "applier": payload.applier,
                    "result": payload.result,
                },
            )
            return _proposal_to_model(proposal)
    raise HTTPException(status_code=404, detail="proposal not found")


@app.post("/learning/rollback")
def rollback_change(payload: LearningRollbackRequest) -> Dict[str, Any]:
    """Record a rollback entry and downgrade XP accordingly."""

    state = _load_state()
    entry = {
        "change_id": payload.change_id,
        "requester": payload.requester,
        "reason": payload.reason,
        "ts": datetime.utcnow().isoformat(),
    }
    state.setdefault("rollbacks", []).append(entry)
    _update_xp(state, payload.requester, reliability=-2.0, velocity=-1.0)
    _save_state(state)
    _append_jsonl(
        EVENTS_LOG,
        {
            "event": "rollback",
            "change_id": payload.change_id,
            "requester": payload.requester,
            "reason": payload.reason,
        },
    )
    _append_jsonl(
        AUDIT_LOG,
        {
            "change_type": "rollback",
            "change_id": payload.change_id,
            "requester": payload.requester,
            "reason": payload.reason,
        },
    )
    return {"ok": True, "entry": entry}


@app.get("/learning/status", response_model=LearningStatusResponse)
def learning_status() -> LearningStatusResponse:
    """Return aggregate learning state for dashboards and governance."""

    state = _load_state()
    proposals = [_proposal_to_model(item) for item in state.get("proposals", [])]
    open_count = sum(1 for proposal in proposals if proposal.status in {"pending", "approved"})
    return LearningStatusResponse(
        proposals=proposals,
        xp={agent: scores for agent, scores in state.get("xp", {}).items()},
        open_proposals=open_count,
        last_updated=datetime.utcnow(),
        recent_events=_recent_events(),
    )


@app.post("/learning/finetune")
def schedule_finetune(payload: FinetuneRequest) -> Dict[str, Any]:
    """Record a PEFT fine-tune request and emit audit metadata."""

    state = _load_state()
    run_id = payload.run_id or f"{payload.agent.lower()}-{uuid.uuid4().hex[:8]}"
    entry = {
        "agent": payload.agent,
        "dataset": payload.dataset,
        "run_id": run_id,
        "notes": payload.notes,
        "ts": datetime.utcnow().isoformat(),
    }
    state.setdefault("finetune_jobs", []).append(entry)
    _update_xp(state, payload.agent, craft=3.0, reliability=1.0)
    _save_state(state)
    _append_jsonl(
        EVENTS_LOG,
        {
            "event": "finetune_scheduled",
            "agent": payload.agent,
            "dataset": payload.dataset,
            "run_id": run_id,
        },
    )
    _append_jsonl(
        AUDIT_LOG,
        {
            "agent": payload.agent,
            "change_type": "finetune_model",
            "audit_ref": run_id,
            "status": "scheduled",
        },
    )
    models_dir = ROOT / "models" / payload.agent.lower() / run_id
    models_dir.mkdir(parents=True, exist_ok=True)
    models_dir.joinpath("README.md").write_text(
        f"# {payload.agent} PEFT Run\n\n"
        f"- Dataset: {payload.dataset}\n"
        f"- Scheduled: {entry['ts']}\n"
        f"- Notes: {payload.notes or 'n/a'}\n"
    )
    return {"ok": True, "job": entry}
