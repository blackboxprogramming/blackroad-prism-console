from __future__ import annotations

import datetime as dt
import uuid

from sqlmodel import Column, DateTime, Field, SQLModel, UniqueConstraint


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    email: str = Field(index=True, sa_column_kwargs={"unique": True}, max_length=320)
    password_hash: str
    scope: str = Field(default="user:read")
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.timezone.utc), sa_column=Column(DateTime(timezone=True), nullable=False))


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    token_hash: str = Field(index=True, nullable=False, max_length=128)
    fingerprint: str | None = Field(default=None, nullable=True, max_length=128)
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.timezone.utc), sa_column=Column(DateTime(timezone=True), nullable=False))
    expires_at: dt.datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    revoked_at: dt.datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))


class RevokedJTI(SQLModel, table=True):
    __tablename__ = "revoked_jti"
    jti: uuid.UUID = Field(primary_key=True, nullable=False)
    revoked_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.timezone.utc), sa_column=Column(DateTime(timezone=True), nullable=False))


class KeyRotation(SQLModel, table=True):
    __tablename__ = "key_rotation"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    kid: str = Field(index=True, nullable=False, max_length=64)
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.timezone.utc), sa_column=Column(DateTime(timezone=True), nullable=False))
    public_pem: str | None = Field(default=None)
    private_pem: str | None = Field(default=None)
    active: bool = Field(default=True)

    __table_args__ = (UniqueConstraint("kid"),)
