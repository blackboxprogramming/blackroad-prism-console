"""FastAPI service for Blackroad handle and mailbox issuance."""
from __future__ import annotations

import re
import unicodedata
from typing import Dict, List, Optional, Set

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, field_validator


RESERVED_TERMS: Set[str] = {
    "admin",
    "root",
    "support",
    "help",
    "billing",
    "payments",
    "security",
    "abuse",
    "postmaster",
    "hostmaster",
    "webmaster",
    "mailer-daemon",
    "official",
    "team",
    "staff",
    "system",
    "null",
    "void",
}

# Seed a small registry to demonstrate collision handling.
_PRESEEDED_HANDLES: Dict[str, str] = {
    "existing": "existing",
}


class HandleRequest(BaseModel):
    desired_handle: str
    did: str
    pgp_fingerprint: Optional[str] = None
    want_alias_at_id: Optional[bool] = None

    model_config = ConfigDict(extra="forbid")

    @field_validator("desired_handle")
    @classmethod
    def validate_desired_handle(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("desired_handle must not be empty")
        return value

    @field_validator("did")
    @classmethod
    def validate_did(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("did must not be empty")
        return value

    @field_validator("pgp_fingerprint")
    @classmethod
    def validate_pgp_fingerprint(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        fingerprint = value.strip().upper()
        if not re.fullmatch(r"[0-9A-F]+", fingerprint):
            raise ValueError("pgp_fingerprint must be hexadecimal without spaces")
        if len(fingerprint) % 2 != 0:
            raise ValueError("pgp_fingerprint must have an even number of characters")
        return fingerprint


class DNSRecord(BaseModel):
    type: str
    name: str
    value: str
    ttl: int
    priority: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class HandleResponse(BaseModel):
    handle: str
    skeleton: str
    available: bool
    requires_review: bool
    email_primary: str
    aliases: List[str]
    records: List[DNSRecord]
    alternates: List[str]
    warnings: List[str]

    model_config = ConfigDict(from_attributes=True)


class HandleErrorDetail(BaseModel):
    code: str
    reasons: List[str]
    suggestions: List[str]


class HandleError(BaseModel):
    error: HandleErrorDetail


class HandleRegistry:
    """In-memory registry for handle uniqueness and policy checks."""

    def __init__(self) -> None:
        self._handles: Dict[str, str] = dict(_PRESEEDED_HANDLES)

    def is_reserved(self, handle: str) -> bool:
        return any(
            handle == term
            or handle.startswith(term)
            or handle.endswith(term)
            or handle.startswith(f"{term}-")
            or handle.startswith(f"{term}_")
            or handle.endswith(f"-{term}")
            or handle.endswith(f"_{term}")
            for term in RESERVED_TERMS
        )

    def normalize(self, desired: str) -> str:
        lowered = unicodedata.normalize("NFKD", desired).encode("ascii", "ignore").decode("ascii")
        lowered = lowered.lower().strip()
        lowered = lowered.replace(".", "-").replace(" ", "-")
        lowered = re.sub(r"[^a-z0-9-_]", "-", lowered)
        lowered = re.sub(r"[-_.]+", "-", lowered)
        lowered = lowered.strip("-_")
        if not lowered:
            raise ValueError("normalized handle is empty")
        if len(lowered) < 3:
            raise ValueError("handle must be at least 3 characters after normalization")
        if len(lowered) > 20:
            raise ValueError("handle must be at most 20 characters after normalization")
        return lowered

    def skeleton(self, handle: str) -> str:
        collapsed = re.sub(r"[-_]+", "-", handle)
        collapsed = collapsed.replace("-", "")
        collapsed = re.sub(r"[^a-z0-9]", "", collapsed)
        return collapsed

    def is_available(self, skeleton: str) -> bool:
        return skeleton not in self._handles

    def register(self, handle: str, skeleton: str) -> None:
        self._handles[skeleton] = handle

    def generate_alternates(self, base_handle: str, skeleton: str) -> List[str]:
        suggestions: List[str] = []
        seed_variants = [base_handle]
        digits = ["1", "7", "9", "42"]
        for digit in digits:
            seed_variants.append(f"{base_handle}{digit}")
        seed_variants.extend(
            [
                f"{base_handle}-hq",
                f"{base_handle}-01",
                f"my-{base_handle}",
                f"go-{base_handle}",
            ]
        )
        if self.is_reserved(base_handle):
            trimmed_front = base_handle[1:]
            trimmed_back = base_handle[:-1]
            if trimmed_front:
                seed_variants.append(trimmed_front)
            if trimmed_back:
                seed_variants.append(trimmed_back)
            if "o" in base_handle:
                swapped_zero = base_handle.replace("o", "0", 1)
                if swapped_zero != base_handle:
                    seed_variants.append(swapped_zero)
        if "-" not in base_handle and len(base_handle) > 4:
            seed_variants.append(base_handle[: len(base_handle) // 2] + "-" + base_handle[len(base_handle) // 2 :])
        if len(base_handle) > 5:
            seed_variants.append(re.sub(r"[aeiou]", "", base_handle, count=1))

        seen: Set[str] = {base_handle}
        for variant in seed_variants:
            if variant in seen:
                continue
            seen.add(variant)
            normalized_variant = variant
            alt_skeleton = self.skeleton(normalized_variant)
            if alt_skeleton == skeleton:
                continue
            if self.is_reserved(normalized_variant):
                continue
            if not self.is_available(alt_skeleton):
                continue
            if len(normalized_variant) < 3 or len(normalized_variant) > 20:
                continue
            suggestions.append(normalized_variant)
            if len(suggestions) == 3:
                break
        return suggestions


registry = HandleRegistry()
app = FastAPI(title="Blackroad Handle & Mailbox Issuer", default_response_class=JSONResponse)


def build_records(handle: str, did: str, pgp_fingerprint: Optional[str]) -> List[DNSRecord]:
    records: List[DNSRecord] = [
        DNSRecord(
            type="MX",
            name=f"{handle}.blackroad.mail",
            value="mx1.blackroad.mail.",
            priority=10,
            ttl=3600,
        ),
    ]
    txt_value = f"did={did}"
    if pgp_fingerprint:
        txt_value = f"{txt_value};pgp={pgp_fingerprint}"
    records.append(
        DNSRecord(
            type="TXT",
            name=f"_blackroad.{handle}.blackroad.mail",
            value=txt_value,
            ttl=3600,
        )
    )
    return records


@app.post(
    "/handles",
    response_model=HandleResponse,
    responses={400: {"model": HandleError}, 409: {"model": HandleError}},
)
async def issue_handle(request: HandleRequest):
    try:
        normalized = registry.normalize(request.desired_handle)
    except ValueError as exc:
        suggestions = registry.generate_alternates("user", "user")  # seed simple suggestions
        error = HandleError(
            error=HandleErrorDetail(
                code="VALIDATION_ERROR",
                reasons=[str(exc)],
                suggestions=suggestions,
            )
        )
        return JSONResponse(status_code=400, content=error.model_dump(exclude_none=True))

    skeleton = registry.skeleton(normalized)

    if registry.is_reserved(normalized):
        alternates = registry.generate_alternates(normalized, skeleton)
        error = HandleError(
            error=HandleErrorDetail(
                code="RESERVED",
                reasons=["handle is reserved or conflicts with a protected role"],
                suggestions=alternates,
            )
        )
        return JSONResponse(status_code=400, content=error.model_dump(exclude_none=True))

    available = registry.is_available(skeleton)
    warnings: List[str] = []
    if not available:
        alternates = registry.generate_alternates(normalized, skeleton)
        error = HandleError(
            error=HandleErrorDetail(
                code="UNAVAILABLE",
                reasons=["handle collides with an existing allocation"],
                suggestions=alternates,
            )
        )
        return JSONResponse(status_code=409, content=error.model_dump(exclude_none=True))

    registry.register(normalized, skeleton)

    aliases: List[str] = []
    if request.want_alias_at_id:
        aliases.append(f"{normalized}@blackroad.id")

    records = build_records(normalized, request.did, request.pgp_fingerprint)

    response = HandleResponse(
        handle=normalized,
        skeleton=skeleton,
        available=True,
        requires_review=False,
        email_primary=f"inbox@{normalized}.blackroad.mail",
        aliases=aliases,
        records=records,
        alternates=[],
        warnings=warnings,
    )
    return JSONResponse(status_code=200, content=response.model_dump(exclude_none=True))
