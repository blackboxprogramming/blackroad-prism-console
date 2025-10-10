"""Prosody sidecar service for pacing and emphasis planning.

Run with:
    uvicorn sidecar:app --reload --port 8000
"""
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import re

app = FastAPI()


class WordIn(BaseModel):
    t: str
    priority: Optional[float] = None


class PlanIn(BaseModel):
    text: Optional[str] = None
    words: Optional[List[WordIn]] = None
    bpm: int = 120
    time: str = "4/4"
    emph_budget: float = 0.35


class PlanOut(BaseModel):
    ssml: str
    seq: List[dict]


VOWELS = "aeiouy"


def syllables(word: str) -> int:
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    groups = re.findall(r"[aeiouy]+", w)
    est = max(1, len(groups))
    if w.endswith("e") and est > 1:
        est -= 1
    return est


def normalize_priorities(ws: List[WordIn]):
    stops = set(
        "the a an and or but to of in on for with at from by we you i it is are be".split()
    )
    raw = []
    for w in ws:
        if w.priority is not None:
            p = w.priority
        else:
            p = 0.5 if w.t.lower() in stops else 1.0
        raw.append(p)
    total = sum(raw) or 1.0
    return [p / total for p in raw]


@app.post("/plan", response_model=PlanOut)
def plan(inp: PlanIn):
    if inp.words:
        tokens = [w.t for w in inp.words]
    else:
        tokens = re.findall(r"\S+", inp.text or "")
    ws = [WordIn(t=t) for t in tokens] if not inp.words else inp.words

    pri = normalize_priorities(ws)

    budget = max(0.0, min(1.0, inp.emph_budget))
    seq = []
    for i, w in enumerate(ws):
        syllable_count = syllables(w.t)
        weight = budget * pri[i]
        per_syllable = weight / syllable_count if syllable_count else 0.0
        pace = max(0.75, min(1.10, 1.0 - 0.4 * per_syllable))
        pitch = round(4 * per_syllable)
        emph = round(weight, 4)
        seq.append({"t": w.t, "pace": pace, "emph": emph, "pitch": pitch})

    ssml_parts = []
    for word in seq:
        rate = int(round(word["pace"] * 100))
        pitch = f'{"+" if word["pitch"] >= 0 else ""}{word["pitch"]}st'
        chunk = f'<prosody rate="{rate}%" pitch="{pitch}">{word["t"]}</prosody>'
        if word["emph"] >= 0.20:
            chunk += '<break time="140ms"/>'
        ssml_parts.append(chunk)

    ssml = "<speak>" + " ".join(ssml_parts) + "</speak>"
    return {"ssml": ssml, "seq": seq}
