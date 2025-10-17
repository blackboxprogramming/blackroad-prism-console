"""Command-line entry point for the BlackRoad agent."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Optional

import typer

from .agent import Agent
from .config import load_settings
from .manifest import ActionCatalog

app = typer.Typer(help="BlackRoad OS agent controller")


@app.command()
def run(config: Path = typer.Option(Path("config/default.yaml"), exists=True, help="Path to the agent config")) -> None:
    """Run the agent until interrupted."""

    settings = load_settings(config)
    catalog = ActionCatalog.from_path(settings.manifests.actions)
    agent = Agent(settings=settings, actions=catalog)

    async def _runner() -> None:
        await agent.start()
        try:
            await asyncio.Event().wait()
        except (KeyboardInterrupt, asyncio.CancelledError):
            pass
        finally:
            await agent.stop()

    asyncio.run(_runner())


@app.command()
def actions(config: Path = typer.Option(Path("config/default.yaml"), exists=True, help="Path to the agent config")) -> None:
    """List actions declared in the manifest."""

    settings = load_settings(config)
    catalog = ActionCatalog.from_path(settings.manifests.actions)
    for action in catalog.all():
        typer.echo(f"{action.id}: {action.summary} (plugin={action.plugin})")


@app.command()
def dispatch(
    action_id: str = typer.Argument(..., help="Action identifier to invoke"),
    prompt: Optional[str] = typer.Option(None, help="Prompt text for model actions"),
    config: Path = typer.Option(Path("config/default.yaml"), exists=True, help="Path to the agent config"),
) -> None:
    """Dispatch an action using the in-process agent."""

    settings = load_settings(config)
    catalog = ActionCatalog.from_path(settings.manifests.actions)
    agent = Agent(settings=settings, actions=catalog)

    async def _runner() -> None:
        await agent.start()
        payload = {"prompt": prompt} if prompt else {}
        result = await agent.dispatch(action_id=action_id, payload=payload)
        typer.echo(result)
        await agent.stop()

    asyncio.run(_runner())
