from __future__ import annotations

import json
from datetime import datetime, timedelta
from random import Random

from sqlmodel import Session, select

from .models import Agent, AgentEvent, Metric, Runbook


def seed_all(session: Session) -> None:
    rng = Random(42)

    if session.exec(select(Agent)).first():
        return

    now = datetime.utcnow()
    agents = []
    events = []
    for index in range(1, 9):
        agent_id = f"agent-{index}"
        status = rng.choice(["online", "degraded", "offline"])
        agent = Agent(
            id=agent_id,
            name=f"Ops Agent {index}",
            domain=rng.choice(["ops", "finance", "science", "creative"]),
            status=status,
            memory_used_mb=round(rng.uniform(128.0, 512.0), 2),
            last_seen_at=now - timedelta(minutes=index),
            version=f"{1 + index // 3}.0.{index}",
        )
        agents.append(agent)
        events.append(
            AgentEvent(
                id=f"event-{agent_id}-1",
                agent_id=agent_id,
                kind="heartbeat",
                at=now - timedelta(minutes=index, seconds=30),
                message="heartbeat received",
            )
        )
    session.add_all(agents)
    session.add_all(events)

    metrics = [
        Metric(
            metric_id="uptime",
            title="Platform Uptime",
            value="99.95%",
            caption="Last 24h",
            icon="activity",
            status="good",
        ),
        Metric(
            metric_id="latency",
            title="Gateway P99 Latency",
            value="420ms",
            caption="Last 5m",
            icon="zap",
            status="warning",
        ),
    ]
    session.add_all(metrics)

    runbooks = []
    for index in range(1, 7):
        schema = {
            "type": "object",
            "properties": {
                "service": {"type": "string"},
                "window": {"type": "string"},
            },
            "required": ["service"],
        }
        runbooks.append(
            Runbook(
                id=f"runbook-{index}",
                title=f"Operational Task {index}",
                description="Standard operational remediation.",
                tags="ops,standard",
                inputs_schema=json.dumps(schema),
                linked_workflow=f"roadglitch.workflow.{index}",
            )
        )
    session.add_all(runbooks)

    session.commit()
