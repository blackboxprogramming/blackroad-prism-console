"""Tiny FastAPI starter covering the Blackroad fairness loop prompts."""
from __future__ import annotations

import math
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, HttpUrl, validator


ISOFormat = str

app = FastAPI(
    title="Blackroad Loop Starter",
    description="Implements Fair-Use governor, resonance ranking, community notes, opt-in ads, wallet, inbox, and transparency log stubs.",
)


# ---------------------------------------------------------------------------
# Utility helpers


def _parse_time(ts: ISOFormat) -> datetime:
    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _merkle_root(leaves: List[str], target_index: int) -> Tuple[str, List[str]]:
    if not leaves:
        return "".zfill(64), []

    nodes = leaves[:]
    index = target_index

    def _hash_pair(left: str, right: str) -> str:
        import hashlib

        return hashlib.sha256((left + right).encode("utf-8")).hexdigest()

    proof: List[str] = []
    while len(nodes) > 1:
        if len(nodes) % 2 == 1:
            nodes.append(nodes[-1])
        next_nodes: List[str] = []
        for i in range(0, len(nodes), 2):
            left = nodes[i]
            right = nodes[i + 1]
            parent = _hash_pair(left, right)
            next_nodes.append(parent)
            if i == index or i + 1 == index:
                proof.append(right if i == index else left)
        nodes = next_nodes
        index //= 2
    return nodes[0], proof


# ---------------------------------------------------------------------------
# Fair-Use Governor models & state


class Actor(BaseModel):
    did: str
    rep_score: float = 0.0
    thanks_received: int = 0
    strikes_30d: int = 0


class Usage(BaseModel):
    tokens_in_bucket: float = 0.0
    bucket_capacity: float = 0.0
    refill_rps: float = 0.0
    last_refill_ts: ISOFormat

    @validator("tokens_in_bucket", "bucket_capacity", "refill_rps", pre=True)
    def _ensure_float(cls, value: float) -> float:
        return float(value)


class RequestInfo(BaseModel):
    tokens_wanted: float = 1
    now_ts: ISOFormat


class Signals(BaseModel):
    spam_flags_24h: int = 0
    dup_posts_24h: int = 0
    similarity_recent: float = 0.0
    abuse_score: float = 0.0
    verified_contributions: int = 0


class FairUseInput(BaseModel):
    actor: Actor
    usage: Usage
    request: RequestInfo
    signals: Signals


class FairUseOutput(BaseModel):
    allowed_now: float
    throttle: bool
    retry_after_ms: int
    new_usage: Usage
    explanation: str
    earn_more_capacity: List[str]


@dataclass
class UsageState:
    tokens_in_bucket: float
    bucket_capacity: float
    refill_rps: float
    last_refill_ts: datetime


usage_store: Dict[str, UsageState] = {}
EARN_MORE_OPTIONS = ["leave_helpful_notes", "add_citations", "complete_learning_pack"]


def _update_usage(actor_id: str, usage: Usage) -> UsageState:
    state = usage_store.get(actor_id)
    if state is None:
        state = UsageState(
            tokens_in_bucket=usage.tokens_in_bucket,
            bucket_capacity=usage.bucket_capacity,
            refill_rps=usage.refill_rps,
            last_refill_ts=_parse_time(usage.last_refill_ts),
        )
        usage_store[actor_id] = state
    else:
        state.tokens_in_bucket = usage.tokens_in_bucket
        state.bucket_capacity = usage.bucket_capacity
        state.refill_rps = usage.refill_rps
        state.last_refill_ts = _parse_time(usage.last_refill_ts)
    return state


def _compute_fair_use(payload: FairUseInput) -> FairUseOutput:
    actor = payload.actor
    signals = payload.signals
    now = _parse_time(payload.request.now_ts)
    state = _update_usage(actor.did, payload.usage)

    delta_seconds = (now - state.last_refill_ts).total_seconds()

    thanks = max(0, actor.thanks_received + signals.verified_contributions)
    comm_mult = 0.25 * math.log2(1 + thanks) + actor.rep_score
    comm_mult = min(2.0, comm_mult)
    if actor.strikes_30d > 3:
        comm_mult = min(comm_mult, 0.5)

    base_rps = 1.0
    refill_rps = base_rps * max(0.25, comm_mult)

    capacity = max(10.0, math.ceil(refill_rps * 20))
    burst = min(capacity, 10 + math.floor(signals.verified_contributions / 5))

    if signals.abuse_score > 0.5 or signals.similarity_recent >= 0.9:
        refill_rps *= 0.5
        burst = max(1.0, math.floor(burst * 0.5))

    available = state.tokens_in_bucket + max(0.0, refill_rps * delta_seconds)
    available = min(capacity, available)

    tokens_wanted = min(float(payload.request.tokens_wanted), burst)
    allowed = min(tokens_wanted, available)
    remaining = max(0.0, tokens_wanted - allowed)

    new_tokens = max(0.0, available - allowed)

    throttle = allowed < float(payload.request.tokens_wanted)
    retry_after_ms = 0
    if throttle and refill_rps > 0 and remaining > 0:
        retry_after_ms = math.ceil(remaining / refill_rps * 1000)

    if throttle:
        if allowed > 0:
            explanation = f"You’re over burst; {allowed:.0f} actions allowed now. Try again in ~{retry_after_ms // 1000}s."
        else:
            explanation = "No tokens available; wait for refill."
    else:
        explanation = "Capacity available."

    state.tokens_in_bucket = new_tokens
    state.bucket_capacity = capacity
    state.refill_rps = refill_rps
    state.last_refill_ts = now

    new_usage = Usage(
        tokens_in_bucket=state.tokens_in_bucket,
        bucket_capacity=state.bucket_capacity,
        refill_rps=state.refill_rps,
        last_refill_ts=now.isoformat().replace("+00:00", "Z"),
    )

    return FairUseOutput(
        allowed_now=allowed,
        throttle=throttle,
        retry_after_ms=retry_after_ms,
        new_usage=new_usage,
        explanation=explanation,
        earn_more_capacity=EARN_MORE_OPTIONS,
    )


@app.post("/fair-use/governor", response_model=FairUseOutput)
def fair_use_governor(payload: FairUseInput) -> FairUseOutput:
    return _compute_fair_use(payload)


# ---------------------------------------------------------------------------
# Resonance ranker


class SourceInfo(BaseModel):
    url: HttpUrl
    type: str = Field(regex="^(primary|secondary)$")


class CandidateSignals(BaseModel):
    human_vouches: float = 0.0
    quality: float = 0.0
    convo_fit: float = 0.0
    freshness_half_life_days: float = 7.0


class Candidate(BaseModel):
    doc_id: str
    title: str
    snippet: str
    url: HttpUrl
    ts: ISOFormat
    signals: CandidateSignals
    sources: List[SourceInfo] = []


class ResonanceRequest(BaseModel):
    query: str
    user_prefs: Dict[str, object]
    candidates: List[Candidate]


class EvidenceItem(BaseModel):
    type: str
    url: HttpUrl


class RankedResult(BaseModel):
    doc_id: str
    title: str
    snippet: str
    url: HttpUrl
    score: float
    evidence: List[EvidenceItem]
    notes: str = ""


class ResonanceResponse(BaseModel):
    query: str
    disambiguations: List[str]
    results: List[RankedResult]


@app.post("/resonance/rank", response_model=ResonanceResponse)
def resonance_rank(payload: ResonanceRequest) -> ResonanceResponse:
    now = datetime.now(tz=timezone.utc)
    scored: List[Tuple[Candidate, float]] = []

    locale = str(payload.user_prefs.get("locale", "")).lower()
    wants_local = "local" in [str(v).lower() for v in payload.user_prefs.get("interests", [])]

    seen_domains: Dict[str, int] = {}

    for candidate in payload.candidates:
        ts = _parse_time(candidate.ts)
        age_days = max(0.0, (now - ts).total_seconds() / 86400)
        half_life = max(0.1, candidate.signals.freshness_half_life_days)
        T = math.exp(-age_days / half_life)

        H = _clamp(candidate.signals.human_vouches)
        Q = _clamp(candidate.signals.quality)
        C = _clamp(candidate.signals.convo_fit)

        score = H * Q * C * T

        domain = urlparse(str(candidate.url)).netloc
        seen = seen_domains.get(domain, 0)
        if seen > 0:
            score *= 0.8 ** seen
        seen_domains[domain] = seen + 1

        if wants_local and locale:
            locale_token = locale.split("-")[-1]
            if locale_token and locale_token in domain.lower():
                score *= 1.1

        scored.append((candidate, score))

    scored.sort(key=lambda item: item[1], reverse=True)

    results: List[RankedResult] = []
    for candidate, score in scored:
        if score <= 0:
            continue
        evidence: List[EvidenceItem] = []
        if candidate.sources:
            evidence.append(EvidenceItem(type="cite", url=candidate.sources[0].url))
            if len(candidate.sources) > 1:
                evidence.append(EvidenceItem(type="counterpoint", url=candidate.sources[1].url))
        results.append(
            RankedResult(
                doc_id=candidate.doc_id,
                title=candidate.title,
                snippet=candidate.snippet,
                url=candidate.url,
                score=round(score, 4),
                evidence=evidence,
                notes="",
            )
        )

    disambiguations: List[str] = []
    if not results:
        tokens = payload.query.split()
        if len(tokens) > 1:
            disambiguations = [
                f"Add detail about {tokens[0]}",
                "Specify location",
                "Include timeframe keyword",
            ][:3]

    return ResonanceResponse(query=payload.query, disambiguations=disambiguations, results=results)


# ---------------------------------------------------------------------------
# Community notes


class SourceRecord(BaseModel):
    url: HttpUrl
    why: str
    independence: str
    quality: float = 0.0


class NotesContext(BaseModel):
    locale: str
    topic: str
    submitted_urls: List[HttpUrl] = []


class NoteInput(BaseModel):
    claim_text: str
    context: NotesContext
    retrieved_sources: List[SourceRecord]


class NoteOutput(BaseModel):
    claim: str
    class_: str = Field(alias="class")
    sources: List[Dict[str, str]]
    contradictions: List[str]
    confidence: float
    note: str

    class Config:
        allow_population_by_field_name = True


@app.post("/community-notes/note", response_model=NoteOutput)
def community_notes(payload: NoteInput) -> NoteOutput:
    claim_words = payload.claim_text.split()
    claim_summary = " ".join(claim_words[:20])

    lower_claim = payload.claim_text.lower()
    if any(token in lower_claim for token in ["should", "believe", "feel"]):
        claim_class = "opinion"
    elif any(token in lower_claim for token in ["may", "could", "suggests"]):
        claim_class = "interpretation"
    else:
        claim_class = "factual"

    sorted_sources = sorted(payload.retrieved_sources, key=lambda s: s.quality, reverse=True)
    selected_sources = sorted_sources[:4]
    if len(selected_sources) < 2:
        raise HTTPException(status_code=400, detail="Need at least two sources for a note")

    contradictions: List[str] = []
    for source in selected_sources:
        if "contradict" in source.why.lower() or "dispute" in source.why.lower():
            contradictions.append(str(source.url))

    base_conf = sum(max(0.0, s.quality) for s in selected_sources) / (len(selected_sources) or 1)
    independence_bonus = 0.1 * sum(1 for s in selected_sources if s.independence == "independent")
    confidence = _clamp(base_conf + independence_bonus, 0.0, 1.0)

    note_sentences = [
        f"Claim context: {payload.context.topic} in {payload.context.locale}.",
        "Multiple sources review the claim and highlight key details.",
    ]
    if contradictions:
        note_sentences.append("Some sources contest elements; see contradictions list.")
    note_words = " ".join(note_sentences).split()
    if len(note_words) > 120:
        note_words = note_words[:120]
    note = " ".join(note_words)

    return NoteOutput(
        claim=claim_summary,
        class_=claim_class,
        sources=[{"url": str(s.url), "why": s.why} for s in selected_sources],
        contradictions=contradictions,
        confidence=round(confidence, 2),
        note=note,
    )


# ---------------------------------------------------------------------------
# Playful ads


class AdBrief(BaseModel):
    name: str
    offer: str
    tone: str
    must_include: List[str] = []


class AdInput(BaseModel):
    brand_brief: AdBrief
    age_floor: int
    community_theme: str


class AdOutput(BaseModel):
    hook: str
    beats: List[str]
    cta: str
    giveback: str
    safety_check: List[str]


@app.post("/ads/playful", response_model=AdOutput)
def playful_ads(payload: AdInput) -> AdOutput:
    brief = payload.brand_brief
    hook_words = (brief.name.split()[:2] + [brief.tone])[:5]
    hook = " ".join(hook_words)

    beats = [
        "0–5s: Animated sticker pops up shouting 'AD' with a wink.",
        f"6–12s: {brief.offer} floats across a doodled skyline in a {brief.tone} vibe.",
        "13–22s: On-screen badges call out consent-friendly perks and opt-in choice.",
        "23–30s: Community wall shows this week's giveback reveal with confetti.",
    ]

    if brief.must_include:
        beats[1] += " Must include: " + ", ".join(brief.must_include) + "."

    cta = "Watch the extended lounge cut"
    giveback = f"Campaign funds {payload.community_theme} community makers each month."
    safety_check = [
        "clear 'AD' label",
        "age_floor ok" if payload.age_floor >= 13 else "age_floor adjust needed",
        "no tracking or targeting",
        "no exaggerated claims",
    ]

    return AdOutput(hook=hook, beats=beats, cta=cta, giveback=giveback, safety_check=safety_check)


# ---------------------------------------------------------------------------
# Wallet micro-payments


class PayeeSplit(BaseModel):
    did: str
    percent: int


class WalletInput(BaseModel):
    payer_did: str
    payees: List[PayeeSplit]
    amount_cents: int
    memo: Optional[str] = None


class NetPayee(BaseModel):
    did: str
    cents: int


class WalletOutput(BaseModel):
    tx_id: str
    gross_cents: int
    fees_cents: int
    net_to_payees: List[NetPayee]
    memo: Optional[str]
    receipt_url: str


@app.post("/wallet/pay", response_model=WalletOutput)
def wallet_pay(payload: WalletInput) -> WalletOutput:
    if not (10 <= payload.amount_cents <= 2000):
        raise HTTPException(status_code=400, detail="Amount must be between 10 and 2000 cents")

    total_percent = sum(p.percent for p in payload.payees)
    if total_percent != 100:
        raise HTTPException(status_code=400, detail="Percent splits must sum to 100")

    fees = min(25, math.ceil(0.015 * payload.amount_cents) + 1)
    net_pool = payload.amount_cents - fees

    allocations: List[NetPayee] = []
    remainder = net_pool
    for payee in payload.payees[:-1]:
        cents = math.floor(net_pool * (payee.percent / 100))
        remainder -= cents
        allocations.append(NetPayee(did=payee.did, cents=cents))
    # last payee gets the remainder to ensure totals align
    last_payee = payload.payees[-1]
    allocations.append(NetPayee(did=last_payee.did, cents=remainder))

    tx_id = f"tx_{secrets.token_hex(4)}"
    receipt_url = f"https://ledger.blackroad/tx/{tx_id}"

    return WalletOutput(
        tx_id=tx_id,
        gross_cents=payload.amount_cents,
        fees_cents=fees,
        net_to_payees=allocations,
        memo=payload.memo,
        receipt_url=receipt_url,
    )


# ---------------------------------------------------------------------------
# Inbox primitive


class Attachment(BaseModel):
    name: str
    mime: str
    size_bytes: int


class InboxInput(BaseModel):
    from_: str = Field(alias="from")
    to: str
    subject: str
    body_md: str
    attachments: List[Attachment] = []
    intent: str
    now_ts: ISOFormat


class InboxOutput(BaseModel):
    status: str
    reason: Optional[str] = None
    advice: Optional[str] = None
    trace_id: str


OPT_IN_REQUIREMENTS: Dict[str, bool] = {}
OPT_IN_STATE: Dict[Tuple[str, str], bool] = {}
TRACE_COUNTER = 0


def _next_trace_id() -> str:
    global TRACE_COUNTER
    TRACE_COUNTER += 1
    return f"mx_{TRACE_COUNTER:05d}"


def _is_hostile(text: str) -> bool:
    lowered = text.lower()
    hostile_tokens = ["idiot", "stupid", "hate", "shut up"]
    return any(token in lowered for token in hostile_tokens)


@app.post("/inbox/send", response_model=InboxOutput)
def inbox_send(payload: InboxInput) -> InboxOutput:
    trace_id = _next_trace_id()

    if OPT_IN_REQUIREMENTS.get(payload.to) and not OPT_IN_STATE.get((payload.from_, payload.to)):
        return InboxOutput(
            status="bounced",
            reason="Recipient allows messages from mutuals only.",
            advice="Request a DM opt-in by reacting to their post or sending a short opt-in request.",
            trace_id=trace_id,
        )

    if _is_hostile(payload.body_md):
        advice = "Consider softening the tone and focus on the facts and desired outcome."
        return InboxOutput(
            status="bounced",
            reason="Message flagged for hostility.",
            advice=advice,
            trace_id=trace_id,
        )

    existing_state = usage_store.get(payload.from_)
    if existing_state is None:
        base_usage = Usage(
            tokens_in_bucket=0.0,
            bucket_capacity=10.0,
            refill_rps=1.0,
            last_refill_ts=payload.now_ts,
        )
    else:
        base_usage = Usage(
            tokens_in_bucket=existing_state.tokens_in_bucket,
            bucket_capacity=existing_state.bucket_capacity,
            refill_rps=existing_state.refill_rps,
            last_refill_ts=existing_state.last_refill_ts.isoformat().replace("+00:00", "Z"),
        )

    governor_payload = FairUseInput(
        actor=Actor(did=payload.from_, rep_score=0.0, thanks_received=0, strikes_30d=0),
        usage=base_usage,
        request=RequestInfo(tokens_wanted=1, now_ts=payload.now_ts),
        signals=Signals(),
    )

    result = _compute_fair_use(governor_payload)
    if result.allowed_now < 1:
        return InboxOutput(
            status="queued",
            reason="Fair-use throttle active.",
            advice=f"Retry after {result.retry_after_ms} ms.",
            trace_id=trace_id,
        )

    return InboxOutput(status="delivered", trace_id=trace_id, advice=None, reason=None)


# ---------------------------------------------------------------------------
# Transparency log


class LogInput(BaseModel):
    event_type: str
    actor_did_hash: str
    summary: str
    data_min_hash: str
    ts: ISOFormat


class LogOutput(BaseModel):
    entry_id: str
    ts: ISOFormat
    merkle_root: str
    proof_path: List[str]
    public_anchor: Optional[str]


log_store: Dict[str, List[str]] = {}


@app.post("/transparency/log", response_model=LogOutput)
def transparency_log(payload: LogInput) -> LogOutput:
    ts = _parse_time(payload.ts)
    day_key = ts.strftime("%Y-%m-%d")

    import hashlib

    entry_material = "|".join(
        [payload.event_type, payload.actor_did_hash, payload.summary, payload.data_min_hash, payload.ts]
    )
    entry_hash = hashlib.sha256(entry_material.encode("utf-8")).hexdigest()

    day_entries = log_store.setdefault(day_key, [])
    day_entries.append(entry_hash)
    entry_index = len(day_entries) - 1

    root, proof_path = _merkle_root(day_entries, entry_index)

    entry_id = f"log_{day_key}_{entry_index:05d}"

    return LogOutput(
        entry_id=entry_id,
        ts=payload.ts,
        merkle_root=root,
        proof_path=proof_path,
        public_anchor=None,
    )
