from datetime import datetime, timedelta

from sqlmodel import Session, SQLModel, create_engine

from prism.models import Agent, AgentEvent
from prism.repo import AgentRepository


def test_agent_repository_lists_by_last_seen() -> None:
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    now = datetime.utcnow()
    agents = [
        Agent(
            id="a1",
            name="Agent 1",
            domain="ops",
            status="online",
            memory_used_mb=256,
            last_seen_at=now - timedelta(minutes=1),
            version="1.0.0",
        ),
        Agent(
            id="a2",
            name="Agent 2",
            domain="ops",
            status="online",
            memory_used_mb=256,
            last_seen_at=now,
            version="1.0.0",
        ),
    ]
    events = [
        AgentEvent(id="e1", agent_id="a1", kind="heartbeat", at=now, message="ok"),
        AgentEvent(id="e2", agent_id="a2", kind="heartbeat", at=now, message="ok"),
    ]
    with Session(engine) as session:
        session.add_all(agents + events)
        session.commit()
        repo = AgentRepository(session)
        listed = repo.list_agents()
        assert listed[0].id == "a2"
        recent = repo.recent_events("a1")
        assert recent[0].agent_id == "a1"
