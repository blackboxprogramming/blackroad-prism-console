import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer

from bench import runner as bench_runner
from bots import available_bots
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import BotResponse, Task
from tools import storage
from safety import policy
from redteam import scenarios as rt_scenarios, runner as rt_runner
from quality import checks as quality_checks
import settings

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
    for name, cls in available_bots().items():
        typer.echo(f"{name}\t{cls.mission}")


def _perf_footer(perf: bool, data: dict) -> None:
    if perf:
        typer.echo(
            f"time={data.get('elapsed_ms')} rss={data.get('rss_mb')} cache=na exec=inproc"
        )


@app.command("bench:list")
def bench_list():
    for name in bench_runner.list_scenarios():
        typer.echo(name)


@app.command("bench:show")
def bench_show(name: str = typer.Option(..., "--name")):
    cfg = bench_runner.load_scenario(name)
    typer.echo(json.dumps(cfg, indent=2))


@app.command("bench:run")
def bench_run(
    name: str = typer.Option(..., "--name"),
    iterations: int = typer.Option(20, "--iter"),
    warmup: int = typer.Option(5, "--warmup"),
    cache: str = typer.Option("na", "--cache"),
    export_csv: Optional[Path] = typer.Option(None, "--export-csv"),
    perf: bool = typer.Option(False, "--perf"),
    as_user: str = typer.Option("system", "--as-user"),
):
    if perf:
        with perf_timer("bench_run") as p:
            bench_runner.run_bench(name, iterations, warmup, cache, export_csv)
    else:
        p = {"elapsed_ms": None, "rss_mb": None}
        bench_runner.run_bench(name, iterations, warmup, cache, export_csv)
    _perf_footer(perf, p)


@app.command("bench:all")
def bench_all(
    perf: bool = typer.Option(False, "--perf"),
    as_user: str = typer.Option("system", "--as-user"),
):
    if perf:
        with perf_timer("bench_all") as p:
            bench_runner.run_all()
    else:
        p = {"elapsed_ms": None, "rss_mb": None}
        bench_runner.run_all()
    _perf_footer(perf, p)


@app.command("slo:report")
def slo_report_cmd(
    perf: bool = typer.Option(False, "--perf"),
    as_user: str = typer.Option("system", "--as-user"),
):
    if perf:
        with perf_timer("slo_report") as p:
            slo_report.build_report()
    else:
        p = {"elapsed_ms": None, "rss_mb": None}
        slo_report.build_report()
    _perf_footer(perf, p)


@app.command("slo:gate")
def slo_gate(
    fail_on: str = typer.Option("regressions", "--fail-on"),
    perf: bool = typer.Option(False, "--perf"),
    as_user: str = typer.Option("system", "--as-user"),
):
    if perf:
        with perf_timer("slo_gate") as p:
            ok = slo_report.gate(fail_on)
    else:
        p = {"elapsed_ms": None, "rss_mb": None}
        ok = slo_report.gate(fail_on)
    _perf_footer(perf, p)
    if not ok:
        raise typer.Exit(code=1)


@app.command("safety:list-packs")
def safety_list_packs():
    for name in policy.list_packs():
        typer.echo(name)


@app.command("safety:evaluate")
def safety_evaluate(
    response: Path = typer.Option(..., "--response", exists=True, dir_okay=False),
    packs: str = typer.Option("", "--packs"),
):
    data = json.loads(storage.read(str(response)))
    resp = BotResponse(**data)
    pack_list = [p.strip() for p in packs.split(",") if p.strip()] or settings.PACKS_ENABLED
    for code in policy.evaluate(resp, pack_list):
        typer.echo(code)


@app.command("redteam:list")
def redteam_list():
    for name in rt_scenarios.list_scenarios():
        typer.echo(name)


@app.command("redteam:run")
def redteam_run(name: str = typer.Option(..., "--name")):
    rep = rt_runner.run_scenario(name)
    typer.echo("passed" if rep.passed else "failed")


@app.command("quality:assess")
def quality_assess(
    artifact: Path = typer.Option(..., "--artifact", exists=True, dir_okay=False),
    config: Path = typer.Option(..., "--config", exists=True, dir_okay=False),
):
    findings = quality_checks.assess(artifact, config)
    for f in findings:
        typer.echo(f.code)


@app.command("playbook:show")
def playbook_show(name: str = typer.Option(..., "--name")):
    path = ROOT / "playbooks" / "safe_ops.md"
    lines = path.read_text(encoding="utf-8").splitlines()
    key = name.replace("_", " ").lower()
    out: list[str] = []
    collect = False
    for line in lines:
        lower = line.lower()
        if lower.startswith("## "):
            heading = lower[3:].strip()
            if collect and heading != key:
                break
            collect = heading == key
            continue
        if collect:
            out.append(line)
    for line in out:
        typer.echo(line)
    typer.echo(f"Path: {path}")


@app.command("bot:run")
def bot_run(
    bot: str = typer.Option(..., "--bot"),
    goal: str = typer.Option(..., "--goal"),
    safety_pack: str = typer.Option("", "--safety-pack"),
):
    task_id = _next_task_id()
    task = Task(id=task_id, goal=goal, context=None, created_at=datetime.utcnow())
    packs = [safety_pack] if safety_pack else None
    response = orchestrator.route(task, bot, safety_packs=packs)
    resp_path = ARTIFACTS / task_id / f"{bot}_response.json"
    storage.write(str(resp_path), response.model_dump(mode="json"))
    typer.echo(str(resp_path))


if __name__ == "__main__":
    app()
