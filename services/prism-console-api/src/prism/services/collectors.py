from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Awaitable, Callable

from sqlmodel import Session

from ..models import Agent, Metric
from .sse import SSEBroadcaster


async def mock_metric_collector(
    session_factory: Callable[[], Awaitable[Session]],
    broadcaster: SSEBroadcaster,
    interval_seconds: int = 15,
) -> None:
    while True:
        async with session_factory() as session:
            metrics = session.query(Metric).all()  # type: ignore[attr-defined]
            if metrics:
                metric = metrics[0]
                metric.value = metric.value
                session.add(metric)
                session.commit()
                await broadcaster.publish(
                    json.dumps({"type": "metric_update", "data": {"metricId": metric.metric_id}})
                )
            agent = session.get(Agent, "agent-1")
            if agent:
                agent.status = "degraded" if agent.status == "online" else "online"
                agent.last_seen_at = datetime.utcnow()
                session.add(agent)
                session.commit()
                await broadcaster.publish(
                    json.dumps({"type": "agent_status", "data": {"agentId": agent.id, "status": agent.status}})
                )
        await asyncio.sleep(interval_seconds)
