"""Minimal Typer-based console for demos."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

import typer

from bots.simple import get_default_bots
from console_io.csv_io import Task
from console_io.xlsx_io import export_tasks_xlsx, import_tasks_xlsx
from simulator.engine import Scenario, run_scenario
from tools import backup

app = typer.Typer(help="Blackroad Prism Console")


@app.command("bot:list")
def bot_list() -> None:
    for name in get_default_bots().keys():
        typer.echo(name)


@app.command("bot:run")
def bot_run(bot: str, goal: str) -> None:
    bots = get_default_bots()
    result = bots[bot].run("forecast", {"pipeline": [1, 2, 3]})
    typer.echo(json.dumps(result))


@app.command("task:import-xlsx")
def task_import_xlsx(xlsx: Path) -> None:
    tasks = import_tasks_xlsx(xlsx)
    typer.echo(f"Imported {len(tasks)} tasks")


@app.command("task:export-xlsx")
def task_export_xlsx(xlsx: Path) -> None:
    tasks = [Task(id="1", title="demo", owner="alice")]
    export_tasks_xlsx(xlsx, tasks)
    typer.echo(str(xlsx))


def _builtin_scenarios() -> Dict[str, Scenario]:
    return {
        "finance_margin_push": Scenario(
            id="finance_margin_push",
            name="GrossMargin Push",
            params={},
            steps=[
                {"name": "Treasury-BOT", "intent": "cash-view", "inputs": {"accounts": [5, 5]}},
                {"name": "RevOps-BOT", "intent": "forecast", "inputs": {"pipeline": [1, 2]}},
            ],
        ),
        "reliability_stabilize": Scenario(
            id="reliability_stabilize",
            name="Reliability Stabilise",
            params={},
            steps=[
                {"name": "SRE-BOT", "intent": "error-budget", "inputs": {"total": 10, "errors": 2}},
            ],
        ),
    }


@app.command("sim:list")
def sim_list() -> None:
    for sid in _builtin_scenarios().keys():
        typer.echo(sid)


@app.command("sim:run")
def sim_run(id: str) -> None:
    scenario = _builtin_scenarios()[id]
    result = run_scenario(scenario)
    dest_dir = Path("artifacts") / scenario.id
    dest_dir.mkdir(parents=True, exist_ok=True)
    (dest_dir / "report.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    (dest_dir / "report.md").write_text(f"# Scenario {scenario.name}\n", encoding="utf-8")
    typer.echo(json.dumps(result))


@app.command("tui:run")
def tui_run() -> None:
    typer.echo("[TUI placeholder]")


@app.command("backup:snapshot")
def backup_snapshot(to: Path) -> None:
    path = backup.snapshot(to)
    typer.echo(str(path))


@app.command("backup:restore")
def backup_restore(from_: Path = typer.Option(..., "--from")) -> None:
    backup.restore(from_)
    typer.echo("restored")


if __name__ == "__main__":
    app()
