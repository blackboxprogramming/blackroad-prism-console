# FILE: /opt/blackroad/services/go_service.py
# Desc: FastAPI service that manages Pachi sessions keyed by game_id.
# Usage: POST /api/go/new → game_id; /play; /genmove; /score; /state; /health.

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Literal, List, Dict
from uuid import uuid4
from datetime import datetime, timedelta
from threading import Lock
from agents.pachi_gtp_agent import PachiGTP, PachiConfig, GTPError

app = FastAPI(title="BlackRoad Go Service")
_SESS: Dict[str, dict] = {}
_SESS_LOCK = Lock()
_SESSION_TTL = timedelta(minutes=30)

def _now(): return datetime.utcnow()

class NewGameRequest(BaseModel):
    size: int = Field(19, ge=5, le=25)
    komi: float = 6.5
    engine_args: List[str] = Field(default_factory=list)

class NewGameResponse(BaseModel):
    game_id: str
    size: int
    komi: float

class PlayRequest(BaseModel):
    game_id: str
    color: Literal["B", "W"]
    move: str  # e.g., D4 or pass

    @validator("move")
    def _normalize_move(cls, v):
        v = v.strip().upper()
        if v != "PASS":
            # allow A1..T19; Pachi will validate legality (we don't trust clients)
            if len(v) < 2 or not v[0].isalpha() or not v[1:].isdigit():
                raise ValueError("Move must be like 'D4' or 'pass'")
        return v

class GenMoveRequest(BaseModel):
    game_id: str
    to_play: Literal["B", "W"] = "B"

class MoveResponse(BaseModel):
    move: str

class ScoreResponse(BaseModel):
    score: str

class StateResponse(BaseModel):
    size: int
    komi: float
    moves: List[str]
    to_play: Literal["B", "W"]

def _gc():
    # Lazy TTL eviction
    with _SESS_LOCK:
        stale = [gid for gid, s in _SESS.items() if _now() - s["last"] > _SESSION_TTL]
        for gid in stale:
            try:
                s = _SESS.pop(gid)
                s["eng"].close()
            except Exception:
                pass

def _get(gid: str):
    _gc()
    with _SESS_LOCK:
        s = _SESS.get(gid)
        if not s:
            raise HTTPException(status_code=404, detail="Unknown or expired game_id")
        s["last"] = _now()
        return s

@app.get("/api/go/health")
def health():
    return {"ok": True, "ts": _now().isoformat()}

@app.post("/api/go/new", response_model=NewGameResponse)
def new(req: NewGameRequest):
    cfg = PachiConfig(size=req.size, komi=req.komi, engine_args=req.engine_args or None)
    eng = PachiGTP(cfg)
    gid = uuid4().hex
    with _SESS_LOCK:
        _SESS[gid] = {"eng": eng, "size": req.size, "komi": req.komi,
                      "moves": [], "to_play": "B", "last": _now(), "lock": Lock()}
    return NewGameResponse(game_id=gid, size=req.size, komi=req.komi)

@app.post("/api/go/play")
def play(req: PlayRequest):
    s = _get(req.game_id)
    with s["lock"]:
        try:
            s["eng"].play(req.color, req.move)
            s["moves"].append(f"{req.color} {req.move}")
            s["to_play"] = "W" if req.color == "B" else "B"
            return {"ok": True}
        except GTPError as e:
            raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/go/genmove", response_model=MoveResponse)
def genmove(req: GenMoveRequest):
    s = _get(req.game_id)
    with s["lock"]:
        try:
            mv = s["eng"].genmove(req.to_play)
            s["moves"].append(f"{req.to_play} {mv}")
            s["to_play"] = "W" if req.to_play == "B" else "B"
            return MoveResponse(move=mv)
        except GTPError as e:
            raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/go/score", response_model=ScoreResponse)
def score(game_id: str):
    s = _get(game_id)
    with s["lock"]:
        try:
            return ScoreResponse(score=s["eng"].final_score())
        except GTPError as e:
            raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/go/state", response_model=StateResponse)
def state(game_id: str):
    s = _get(game_id)
    return StateResponse(size=s["size"], komi=s["komi"], moves=s["moves"], to_play=s["to_play"])

@app.delete("/api/go/{game_id}")
def destroy(game_id: str):
    with _SESS_LOCK:
        s = _SESS.pop(game_id, None)
    if s:
        try: s["eng"].close()
        except Exception: pass
    return {"ok": True}
