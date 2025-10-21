"""Scenario endpoints for profitability modelling."""

from __future__ import annotations

from datetime import datetime
from typing import Dict
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from ...schemas import ScenarioCreate, ScenarioDetail, ScenarioListItem

router = APIRouter()


class _ScenarioStore:
    """A lightweight, in-memory store used until the database layer ships."""

    def __init__(self) -> None:
        self._items: Dict[str, ScenarioDetail] = {}

    def list(self) -> list[ScenarioListItem]:
        return [
            ScenarioListItem(
                id=item.id,
                name=item.name,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
            for item in self._items.values()
        ]

    def get(self, scenario_id: str) -> ScenarioDetail:
        try:
            return self._items[scenario_id]
        except KeyError as exc:  # pragma: no cover - defensive branch
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND) from exc

    def create(self, payload: ScenarioCreate) -> ScenarioDetail:
        scenario_id = str(uuid4())
        now = datetime.utcnow()
        detail = ScenarioDetail(
            id=scenario_id,
            name=payload.name,
            params=payload.params,
            notes=[],
            created_at=now,
            updated_at=now,
        )
        self._items[scenario_id] = detail
        return detail


_store = _ScenarioStore()


@router.get("", response_model=list[ScenarioListItem])
async def list_scenarios() -> list[ScenarioListItem]:
    """Return saved scenarios for the active organisation."""

    return _store.list()


@router.post("", response_model=ScenarioDetail, status_code=status.HTTP_201_CREATED)
async def create_scenario(payload: ScenarioCreate) -> ScenarioDetail:
    """Create a new scenario in the temporary in-memory store."""

    return _store.create(payload)


@router.get("/{scenario_id}", response_model=ScenarioDetail)
async def get_scenario(scenario_id: str) -> ScenarioDetail:
    """Return a single scenario by identifier."""

    return _store.get(scenario_id)
