import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer

from bench import runner as bench_runner
from bots import available_bots
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
from tools import storage
from services import catalog as svc_catalog
from services import deps as svc_deps
from runbooks import executor as rb_executor
from healthchecks import synthetic as hc_synth
from change import calendar as change_calendar
from status import generator as status_gen
import time

from legal import clm, clauses, redline, obligations, compliance_calendar, export_controls, data_room
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


@app.command("svc:load")
def svc_load(dir: str = typer.Option("configs/services", "--dir")):
    svc_catalog.load_services(f"{dir}/*.yaml")
    typer.echo("catalog loaded")


@app.command("svc:deps")
def svc_deps_cmd(service: str = typer.Option(..., "--service"), dir: str = typer.Option("configs/services", "--dir")):
    services = svc_catalog.load_services(f"{dir}/*.yaml")
    for dep in svc_deps.blast_radius(service, services):
        typer.echo(dep)


@app.command("svc:validate")
def svc_validate(dir: str = typer.Option("configs/services", "--dir")):
    services = svc_catalog.load_services(f"{dir}/*.yaml")
    errs = svc_deps.validate_dependencies(services)
    if errs:
        for e in errs:
            typer.echo(e)
        raise typer.Exit(code=1)
    typer.echo("ok")


@app.command("rb:run")
def rb_run(file: str = typer.Option(..., "--file")):
    code = rb_executor.run(file)
    typer.echo(code)


@app.command("rb:list")
def rb_list():
    for name in rb_executor.list_examples():
        typer.echo(name)


@app.command("hc:run")
def hc_run(service: str = typer.Option(..., "--service")):
    results = hc_synth.run_checks(service)
    typer.echo(json.dumps(results))


@app.command("hc:summary")
def hc_summary(service: str = typer.Option(..., "--service")):
    data = hc_synth.summary(service)
    typer.echo(json.dumps(data))


@app.command("change:add")
def change_add(
    service: str = typer.Option(..., "--service"),
    type: str = typer.Option(..., "--type"),
    start: str = typer.Option(..., "--start"),
    end: str = typer.Option(..., "--end"),
    risk: str = typer.Option(..., "--risk"),
):
    cid = f"chg-{int(time.time())}"
    ch = change_calendar.Change(id=cid, service=service, type=type, start=start, end=end, owner="cli", risk=risk)
    change_calendar.add_change(ch)
    typer.echo(cid)


@app.command("change:list")
def change_list(
    service: str = typer.Option(None, "--service"),
    start: str = typer.Option(None, "--from"),
    end: str = typer.Option(None, "--to"),
):
    for c in change_calendar.list_changes(service, start, end):
        typer.echo(json.dumps(c))


@app.command("change:conflicts")
def change_conflicts(service: str = typer.Option(..., "--service")):
    issues = change_calendar.conflicts(service)
    if issues:
        for i in issues:
            typer.echo(i)
        raise typer.Exit(code=1)
    typer.echo("ok")


@app.command("status:build")
def status_build():
    status_gen.build()
    typer.echo("built")


# Legal Ops -----------------------------------------------------------------


@app.command("legal:contract:new")
def legal_contract_new(type: str = typer.Option(..., "--type"), counterparty: str = typer.Option(..., "--counterparty")):
    c = clm.create(type, counterparty)
    typer.echo(c.id)


@app.command("legal:contract:route")
def legal_contract_route(id: str = typer.Option(..., "--id"), to_role: str = typer.Option(..., "--to-role")):
    clm.route_for_review(id, to_role)
    typer.echo("routed")


@app.command("legal:contract:approve")
def legal_contract_approve(id: str = typer.Option(..., "--id"), as_user: str = typer.Option(..., "--as-user")):
    clm.approve(id, as_user)
    typer.echo("approved")


@app.command("legal:contract:execute")
def legal_contract_execute(id: str = typer.Option(..., "--id"), date: str = typer.Option(..., "--date")):
    clm.execute(id, date)
    typer.echo("executed")


@app.command("legal:approve:request")
def legal_approve_request(id: str = typer.Option(..., "--id"), for_role: str = typer.Option(..., "--for-role"), note: str = typer.Option("", "--note")):
    clm.route_for_review(id, for_role)
    typer.echo("requested")


@app.command("legal:esign")
def legal_esign(id: str = typer.Option(..., "--id"), user: str = typer.Option(..., "--user"), text: str = typer.Option(..., "--text")):
    clm.esign(id, user, text)
    typer.echo("signed")


@app.command("legal:clauses:list")
def legal_clauses_list(tag: str = typer.Option(None, "--tag")):
    for c in clauses.load_clauses(tag):
        typer.echo(c["id"])


@app.command("legal:assemble")
def legal_assemble(template: str = typer.Option(..., "--template"), options: Path = typer.Option(..., "--options", exists=True, dir_okay=False), out: Path = typer.Option(..., "--out")):
    doc, _ = clauses.assemble(template, str(options))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc)
    typer.echo(str(out))


@app.command("legal:redline")
def legal_redline_cmd(old: Path = typer.Option(..., "--old"), new: Path = typer.Option(..., "--new")):
    diff = redline.write_redline(str(old), str(new), str(ROOT / "artifacts" / "legal" / "redlines" / f"{new.stem}_vs_{old.stem}"))
    typer.echo(json.dumps(diff))


@app.command("legal:obligations:extract")
def legal_obligations_extract(id: str = typer.Option(..., "--id")):
    obs = obligations.extract(id)
    typer.echo(json.dumps(obs))


@app.command("legal:obligations:list")
def legal_obligations_list(due_within: int = typer.Option(None, "--due-within")):
    obs = obligations.list_obligations(due_within)
    for ob in obs:
        typer.echo(json.dumps(ob))


@app.command("legal:calendar:build")
def legal_calendar_build():
    items = compliance_calendar.build()
    typer.echo(len(items))


@app.command("legal:calendar:list")
def legal_calendar_list(from_date: str = typer.Option(..., "--from"), to_date: str = typer.Option(..., "--to")):
    items = compliance_calendar.list_items(from_date, to_date)
    for it in items:
        typer.echo(json.dumps(it))


@app.command("legal:export:screen")
def legal_export_screen(partner: str = typer.Option(..., "--partner"), order: Path = typer.Option(..., "--order", exists=True, dir_okay=False)):
    res = export_controls.screen(partner, str(order))
    typer.echo(json.dumps(res))


@app.command("legal:dataroom:build")
def legal_dataroom_build(include: str = typer.Option(..., "--include")):
    includes = [s.strip() for s in include.split(",") if s.strip()]
    manifest = data_room.build(includes)
    typer.echo(len(manifest))


if __name__ == "__main__":
    app()
