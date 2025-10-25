from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from .config import Settings, get_settings


async def verify_token(request: Request, settings: Settings = Depends(get_settings)) -> None:
    """Simple bearer token guard."""

    header = request.headers.get("authorization")
    if not header or not header.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = header.split(" ", 1)[1].strip()
    if token != settings.auth_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")


__all__ = ["verify_token"]

