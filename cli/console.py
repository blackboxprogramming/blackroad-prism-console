import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer

from tools import storage

app = typer.Typer()

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"


def _next_task_id() -> str:
    counter_path = ARTIFACTS / "last_task_id.txt"
    last = int(storage.read(str(counter_path)) or 0)
    new = last + 1
    storage.write(str(counter_path), str(new))
    return f"T{new:04d}"


@app.command("task:create")
def task_create(
    goal: str = typer.Option(..., "--goal"),
    context: Optional[Path] = typer.Option(None, "--context", exists=True, dir_okay=False),
):
    from orchestrator.protocols import Task

    ctx = json.loads(storage.read(str(context))) if context else None
    task_id = _next_task_id()
    task = Task(id=task_id, goal=goal, context=ctx, created_at=datetime.utcnow())
    storage.write(str(ARTIFACTS / task_id / "task.json"), task.model_dump(mode="json"))
    typer.echo(task_id)


@app.command("task:route")
def task_route(
    id: str = typer.Option(..., "--id"),
    bot: str = typer.Option(..., "--bot"),
):
    from orchestrator import orchestrator
    from orchestrator.protocols import Task

    task_data = json.loads(storage.read(str(ARTIFACTS / id / "task.json")))
    task = Task(**task_data)
    response = orchestrator.route(task, bot)
    storage.write(str(ARTIFACTS / id / "response.json"), response.model_dump(mode="json"))
    typer.echo(response.summary)


@app.command("task:status")
def task_status(id: str = typer.Option(..., "--id")):
    resp_path = ARTIFACTS / id / "response.json"
    if not resp_path.exists():
        typer.echo("No response")
        raise typer.Exit(code=1)
    data = json.loads(storage.read(str(resp_path)))
    typer.echo(f"Summary: {data.get('summary')}")
    typer.echo("Next actions:")
    for act in data.get("next_actions", []):
        typer.echo(f"- {act}")


@app.command("bot:list")
def bot_list():
    from bots import available_bots

    for name, cls in available_bots().items():
        typer.echo(f"{name}\t{cls.mission}")


@app.command("preflight:check")
def preflight_check():
    require = os.getenv("REQUIRE_SIGNED_ARTIFACTS", "False") == "True"
    wheels_dir = ROOT / "dist" / "wheels"
    sha_file = wheels_dir / "SHA256SUMS"
    if require and not sha_file.exists():
        typer.echo("signatures missing")
        raise typer.Exit(code=1)
    typer.echo("preflight ok")


@app.command("integrity:verify")
def integrity_verify():
    try:
        subprocess.check_call([sys.executable, "build/signing/verify_wheels.py"])
        subprocess.check_call([sys.executable, "build/sbom.py"])
        subprocess.check_call(
            [
                "gpg",
                "--batch",
                "--verify",
                "dist/attestation.json.asc",
                "dist/attestation.json",
            ],
            env={"GNUPGHOME": str(ROOT / "build" / "signing" / "gnupg")},
        )
    except subprocess.CalledProcessError:
        typer.echo("FAIL")
        raise typer.Exit(code=1)
    typer.echo("PASS")


@app.command("policy:license-check")
def policy_license_check():
    try:
        subprocess.check_call([sys.executable, "build/licenses.py"])
    except subprocess.CalledProcessError:
        raise typer.Exit(code=1)
    typer.echo("OK")


@app.command("version:show")
def version_show():
    from importlib.metadata import version

    typer.echo(version("blackroad-prism-console"))


if __name__ == "__main__":
    app()
