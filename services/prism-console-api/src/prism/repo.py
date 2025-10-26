from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from sqlmodel import Session, delete, select

from .models import Agent, AgentEvent, Metric, Runbook, Setting


class AgentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_agents(self) -> Sequence[Agent]:
        statement = select(Agent).order_by(Agent.last_seen_at.desc())
        return self.session.exec(statement).all()

    def get_agent(self, agent_id: str) -> Agent | None:
        return self.session.get(Agent, agent_id)

    def recent_events(self, agent_id: str, limit: int = 10) -> Sequence[AgentEvent]:
        statement = (
            select(AgentEvent)
            .where(AgentEvent.agent_id == agent_id)
            .order_by(AgentEvent.at.desc())
            .limit(limit)
        )
        return self.session.exec(statement).all()


class RunbookRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_runbooks(self) -> Sequence[Runbook]:
        statement = select(Runbook).order_by(Runbook.title)
        return self.session.exec(statement).all()

    def get_runbook(self, runbook_id: str) -> Runbook | None:
        return self.session.get(Runbook, runbook_id)


class SettingsRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def upsert(self, key: str, value: str) -> None:
        model = self.session.get(Setting, key)
        if model is None:
            model = Setting(key=key, value=value)
            self.session.add(model)
        else:
            model.value = value
            model.updated_at = datetime.utcnow()
        self.session.commit()

    def get(self, key: str) -> str | None:
        model = self.session.get(Setting, key)
        return model.value if model else None


class MetricRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_metrics(self) -> Sequence[Metric]:
        statement = select(Metric).order_by(Metric.title)
        return self.session.exec(statement).all()

    def replace_metrics(self, metrics: Sequence[Metric]) -> None:
        self.session.exec(delete(Metric))
        for metric in metrics:
            self.session.add(metric)
        self.session.commit()


__all__ = [
    "AgentRepository",
    "RunbookRepository",
    "SettingsRepository",
    "MetricRepository",
]
