"""SQLAlchemy models representing core mining-ops lab entities."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base model that ensures UUID primary keys and timestamps."""

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class Org(Base):
    """Organisational container for scenarios, jobs, and billing data."""

    __tablename__ = "orgs"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    plan: Mapped[str] = mapped_column(String(32), default="free", nullable=False)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    users: Mapped[list["User"]] = relationship(back_populates="org")
    scenarios: Mapped[list["Scenario"]] = relationship(back_populates="org")
    jobs: Mapped[list["Job"]] = relationship(back_populates="org")


class User(Base):
    """Authenticated platform user."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="member", nullable=False)
    org_id: Mapped[str] = mapped_column(ForeignKey("orgs.id"), nullable=False)

    org: Mapped[Org] = relationship(back_populates="users")


class Scenario(Base):
    """Profitability modeling configuration saved by the user."""

    __tablename__ = "scenarios"

    org_id: Mapped[str] = mapped_column(ForeignKey("orgs.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    params_json: Mapped[dict] = mapped_column(JSON, nullable=False)

    org: Mapped[Org] = relationship(back_populates="scenarios")
    jobs: Mapped[list["Job"]] = relationship(back_populates="scenario")


class Job(Base):
    """Represents a single short-lived container workload execution."""

    __tablename__ = "jobs"

    org_id: Mapped[str] = mapped_column(ForeignKey("orgs.id"), nullable=False)
    scenario_id: Mapped[str | None] = mapped_column(ForeignKey("scenarios.id"), nullable=True)
    image_uri: Mapped[str] = mapped_column(String(512), nullable=False)
    cpu: Mapped[int] = mapped_column(Integer, nullable=False)
    memory: Mapped[int] = mapped_column(Integer, nullable=False)
    gpu: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_runtime_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_cap_usd: Mapped[float] = mapped_column(Float, nullable=False)
    state: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    stopped_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    termination_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    org: Mapped[Org] = relationship(back_populates="jobs")
    scenario: Mapped[Scenario | None] = relationship(back_populates="jobs")
    telemetry: Mapped[list["TelemetrySample"]] = relationship(back_populates="job")


class TelemetrySample(Base):
    """Rolling telemetry emitted by the workload sidecar."""

    __tablename__ = "telemetry_samples"

    job_id: Mapped[str] = mapped_column(ForeignKey("jobs.id"), nullable=False)
    ts: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    cpu_pct: Mapped[float] = mapped_column(Float, nullable=False)
    mem_pct: Mapped[float] = mapped_column(Float, nullable=False)
    gpu_util: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_tx_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    net_rx_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    spot_interruption: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    job: Mapped[Job] = relationship(back_populates="telemetry")


class UsageCounter(Base):
    """Aggregated usage metrics for subscription enforcement."""

    __tablename__ = "usage_counters"

    org_id: Mapped[str] = mapped_column(ForeignKey("orgs.id"), nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    job_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    concurrent_jobs_peak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    org: Mapped[Org] = relationship()


class ComplianceAck(Base):
    """Tracks per-provider compliance acknowledgements."""

    __tablename__ = "compliance_acks"

    org_id: Mapped[str] = mapped_column(ForeignKey("orgs.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False)
    accepted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    accepted_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)

    org: Mapped[Org] = relationship()
    user: Mapped[User] = relationship()


class AuditLog(Base):
    """Administrative audit events (e.g., plan changes, allowlist edits)."""

    __tablename__ = "audit_logs"

    org_id: Mapped[str] = mapped_column(ForeignKey("orgs.id"), nullable=False)
    actor_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)

    org: Mapped[Org] = relationship()
    actor: Mapped[User] = relationship()
