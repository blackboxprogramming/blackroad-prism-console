from __future__ import annotations

import datetime as dt
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr

from ..crypto.hashing import hash_password, verify_password
from ..crypto.tokens import TokenService
from ..dependencies import get_token_service, get_user_repository
from ..repo import UserRepository

router = APIRouter(prefix="", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class SignupResponse(BaseModel):
    class UserOut(BaseModel):
        id: str
        email: EmailStr
        createdAt: dt.datetime

    user: UserOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    fingerprint: str | None = None


class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    expiresIn: int
    tokenType: str


class LogoutRequest(BaseModel):
    refreshToken: str | None = None


class LogoutResponse(BaseModel):
    ok: bool


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest,
    users: Annotated[UserRepository, Depends(get_user_repository)],
):
    existing = await users.get_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = await users.create_user(payload.email, hash_password(payload.password))
    return SignupResponse(user=SignupResponse.UserOut(id=str(user.id), email=user.email, createdAt=user.created_at))


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    token_service: Annotated[TokenService, Depends(get_token_service)],
    users: Annotated[UserRepository, Depends(get_user_repository)],
):
    user = await users.get_by_email(payload.email)
    if not user or not verify_password(user.password_hash, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    tokens = await token_service.issue_tokens(user_id=user.id, scope=user.scope, fingerprint=payload.fingerprint)
    return LoginResponse(**tokens)


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    payload: LogoutRequest,
    token_service: Annotated[TokenService, Depends(get_token_service)],
):
    token = payload.refreshToken or _extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refresh token required")
    await token_service.revoke_refresh(token)
    return LogoutResponse(ok=True)


def _extract_token(request: Request) -> str | None:
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]
    return None
