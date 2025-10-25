from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ..crypto.tokens import TokenService
from ..dependencies import get_token_service

router = APIRouter(prefix="/tokens", tags=["tokens"])


class RefreshRequest(BaseModel):
    refreshToken: str | None = None
    fingerprint: str | None = None


class RefreshResponse(BaseModel):
    accessToken: str
    refreshToken: str
    expiresIn: int
    tokenType: str


class VerifyRequest(BaseModel):
    token: str | None = None


class VerifyResponse(BaseModel):
    valid: bool
    sub: str | None = None
    scope: str | None = None
    iat: int | None = None
    exp: int | None = None
    iss: str | None = None
    jti: str | None = None
    kid: str | None = None
    reason: str | None = None


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    request: Request,
    payload: RefreshRequest,
    token_service: Annotated[TokenService, Depends(get_token_service)],
):
    token = payload.refreshToken or _extract_authorization(request)
    if not token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    try:
        tokens = await token_service.rotate_refresh(refresh_token=token, fingerprint=payload.fingerprint)
    except ValueError as exc:  # pragma: no cover - simple mapping
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return RefreshResponse(**tokens)


@router.post("/verify", response_model=VerifyResponse)
async def verify(
    request: Request,
    payload: VerifyRequest,
    token_service: Annotated[TokenService, Depends(get_token_service)],
):
    token = payload.token or _extract_authorization(request)
    if not token:
        return VerifyResponse(valid=False, reason="missing_token")
    from ..dependencies import get_jwt_service

    jwt_service = get_jwt_service()
    try:
        claims = jwt_service.decode(token)
    except Exception as exc:  # pragma: no cover - error mapping
        return VerifyResponse(valid=False, reason=str(exc))
    jti = claims.get("jti")
    if jti:
        import uuid

        try:
            jti_uuid = uuid.UUID(jti)
        except ValueError:
            return VerifyResponse(valid=False, reason="invalid_jti")
        if await token_service.is_access_revoked(jti_uuid):
            return VerifyResponse(valid=False, reason="revoked")
    return VerifyResponse(
        valid=True,
        sub=claims.get("sub"),
        scope=claims.get("scope"),
        iat=claims.get("iat"),
        exp=claims.get("exp"),
        iss=claims.get("iss"),
        jti=jti,
        kid=claims.get("kid"),
    )


def _extract_authorization(request: Request) -> str | None:
    header = request.headers.get("authorization")
    if header and header.lower().startswith("bearer "):
        return header.split(" ", 1)[1]
    return None
