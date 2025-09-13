import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from dataclasses import asdict

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
import importlib

from plm import bom as plm_bom, eco as plm_eco
from mfg import routing as mfg_routing, work_instructions as mfg_wi, spc as mfg_spc, coq as mfg_coq, mrp as mfg_mrp

mfg_yield = importlib.import_module("mfg.yield")

from close import calendar as close_calendar, journal as close_journal, recon as close_recon, flux as close_flux, sox as close_sox, packet as close_packet

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


if __name__ == "__main__":
    app()

from close import calendar as close_calendar
from close import journal as close_journal
from close import recon as close_recon
from close import flux as close_flux
from close import sox as close_sox
from close import packet as close_packet


@app.command("close:cal:new")
def close_cal_new(period: str = typer.Option(..., "--period"), template: Path = typer.Option(..., "--template", exists=True)):
    cal = close_calendar.CloseCalendar.from_template(period, str(template))
    cal.save()
    typer.echo("ok")


@app.command("close:cal:list")
def close_cal_list(period: str = typer.Option(..., "--period")):
    cal = close_calendar.load_calendar(period)
    for t in cal.tasks:
        typer.echo(json.dumps(asdict(t)))


@app.command("close:cal:update")
def close_cal_update(
    period: str = typer.Option(..., "--period"),
    task: str = typer.Option(..., "--task"),
    status: str = typer.Option(None, "--status"),
    evidence: str = typer.Option(None, "--evidence"),
):
    cal = close_calendar.load_calendar(period)
    cal.update(task, status, evidence)
    typer.echo("updated")


@app.command("close:jrnl:propose")
def close_jrnl_propose(
    period: str = typer.Option(..., "--period"),
    rules: Path = typer.Option(..., "--rules", exists=True),
):
    close_journal.propose_journals(period, str(rules))
    typer.echo("proposed")


@app.command("close:jrnl:post")
def close_jrnl_post(period: str = typer.Option(..., "--period")):
    journals = close_journal.load_journals(period)
    close_journal.post(period, journals)
    typer.echo("posted")


@app.command("close:recon:run")
def close_recon_run(period: str = typer.Option(..., "--period"), fixtures: Path = typer.Option(..., "--fixtures", exists=True)):
    close_recon.run_recons(period, str(fixtures))
    typer.echo("recons")


@app.command("close:flux")
def close_flux_cmd(
    period: str = typer.Option(..., "--period"),
    prev: str = typer.Option(..., "--prev"),
    py: str = typer.Option(..., "--py"),
    threshold: float = typer.Option(..., "--threshold"),
):
    close_flux.run_flux(period, prev, py, threshold)
    typer.echo("flux")


@app.command("close:sox:add")
def close_sox_add(
    period: str = typer.Option(..., "--period"),
    control: str = typer.Option(..., "--control"),
    path: str = typer.Option(..., "--path"),
    owner: str = typer.Option("cli", "--owner"),
):
    close_sox.add_evidence(period, control, path, owner)
    typer.echo("logged")


@app.command("close:sox:check")
def close_sox_check(period: str = typer.Option(..., "--period")):
    close_sox.check_evidence(period)
    typer.echo("ok")


@app.command("close:packet")
def close_packet_cmd(period: str = typer.Option(..., "--period")):
    close_packet.build_packet(period)
    typer.echo("packet")


@app.command("close:sign")
def close_sign(period: str = typer.Option(..., "--period"), role: str = typer.Option(..., "--role"), as_user: str = typer.Option(..., "--as-user")):
    close_packet.sign(period, role, as_user)
    typer.echo("signed")


@app.command("plm:items:load")
def plm_items_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    plm_bom.load_items(str(dir))
    typer.echo("ok")


@app.command("plm:bom:load")
def plm_bom_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    plm_bom.load_boms(str(dir))
    typer.echo("ok")


@app.command("plm:bom:explode")
def plm_bom_explode(item: str = typer.Option(..., "--item"), rev: str = typer.Option(..., "--rev"), level: int = typer.Option(1, "--level")):
    lines = plm_bom.explode(item, rev, level)
    for lvl, comp, qty in lines:
        typer.echo(f"{lvl}\t{comp}\t{qty}")


@app.command("plm:eco:new")
def plm_eco_new(item: str = typer.Option(..., "--item"), from_rev: str = typer.Option(..., "--from"), to_rev: str = typer.Option(..., "--to"), reason: str = typer.Option(..., "--reason")):
    ch = plm_eco.new_change(item, from_rev, to_rev, reason)
    typer.echo(ch.id)


@app.command("plm:eco:impact")
def plm_eco_impact(id: str = typer.Option(..., "--id")):
    impact = plm_eco.impact(id)
    typer.echo(f"impact {impact}")


@app.command("plm:eco:approve")
def plm_eco_approve(id: str = typer.Option(..., "--id"), as_user: str = typer.Option(..., "--as-user")):
    plm_eco.approve(id, as_user)
    typer.echo("approved")


@app.command("plm:eco:release")
def plm_eco_release(id: str = typer.Option(..., "--id")):
    plm_eco.release(id)
    typer.echo("released")


@app.command("mfg:wc:load")
def mfg_wc_load(file: Path = typer.Option(..., "--file", exists=True, dir_okay=False)):
    mfg_routing.load_work_centers(str(file))
    typer.echo("ok")


@app.command("mfg:routing:load")
def mfg_routing_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    mfg_routing.load_routings(str(dir))
    typer.echo("ok")


@app.command("mfg:routing:capcheck")
def mfg_routing_capcheck(item: str = typer.Option(..., "--item"), rev: str = typer.Option(..., "--rev"), qty: int = typer.Option(..., "--qty")):
    res = mfg_routing.capacity_check(item, rev, qty)
    typer.echo(json.dumps(res))


@app.command("mfg:wi:render")
def mfg_wi_render(item: str = typer.Option(..., "--item"), rev: str = typer.Option(..., "--rev")):
    path = mfg_wi.render(item, rev)
    typer.echo(str(path))


@app.command("mfg:spc:analyze")
def mfg_spc_analyze(op: str = typer.Option(..., "--op"), window: int = typer.Option(50, "--window")):
    findings = mfg_spc.analyze(op, window)
    typer.echo(" ".join(findings))


@app.command("mfg:yield")
def mfg_yield_cmd(period: str = typer.Option(..., "--period")):
    stats = mfg_yield.compute(period)
    typer.echo(json.dumps(stats))


@app.command("mfg:coq")
def mfg_coq_cmd(period: str = typer.Option(..., "--period")):
    totals = mfg_coq.build(period)
    typer.echo(json.dumps(totals))


@app.command("mfg:mrp")
def mfg_mrp_cmd(demand: Path = typer.Option(..., "--demand", exists=True), inventory: Path = typer.Option(..., "--inventory", exists=True), pos: Path = typer.Option(..., "--pos", exists=True)):
    plan = mfg_mrp.plan(str(demand), str(inventory), str(pos))
    typer.echo(json.dumps(plan))

@app.command("status:build")
def status_build():
    status_gen.build()
    typer.echo("built")

if __name__ == "__main__":
    app()
