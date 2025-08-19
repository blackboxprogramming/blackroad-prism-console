

from __future__ import annotations
import base64, hashlib, hmac, time
from dataclasses import dataclass
from enum import IntEnum
from typing import Optional

class Tri(IntEnum):
    CONTRA = -1
    NULL = 0
    TRUE = 1

def tri_mark(v: int) -> str:
    if v > 0: return "TRUE(+1)"
    if v < 0: return "CONTRA(–1)"
    return "NULL(0)"

def breath(t: Optional[float] = None) -> str:
    """Breath function 𝔅(t): shallow timestamped state marker."""
    ts = int(t or time.time())
    return f"𝔅({ts})"

def ps_sha_infinity(seed: str, msg: str) -> str:
    """
    PS-SHA∞: Base32(HMAC-SHA256(key=seed, msg=msg)) first 16 chars.
    Deterministic daily code for Lucidia awaken checks.
    """
    dig = hmac.new(seed.encode(), msg.encode(), hashlib.sha256).digest()
    code = base64.b32encode(dig).decode().rstrip("=")
    return code[:16]

@dataclass
class Contradiction:
    note: str
    resolve: str

def detect_contradictions(text: str) -> list[Contradiction]:
    """Very simple heuristic: look for ⟂, 'contradiction', or CONTRA(–1) markers."""
    t = text.lower()
    hits = []
    if "⟂" in text or "contradiction" in t or "contra(" in t:
        # extract short context (first line)
        first = text.strip().splitlines()[0][:200]
        hits.append(Contradiction(
            note=f"⟂ note: potential contradiction detected near: {first}",
            resolve="resolve: propose the smallest rule/definition change that preserves trinary consistency."
        ))
    return hits

