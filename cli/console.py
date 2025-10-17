import importlib
import json
import time
from dataclasses import asdict
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import typer

from bench import runner as bench_runner
from bots import available_bots
from change import calendar as change_calendar
from enablement import calendar as en_cal
from enablement import certify as en_cert
from enablement import courses as en_courses
from enablement import feedback as en_fb
from enablement import labs as en_labs
from enablement import paths as en_paths
from enablement import quizzes as en_quizzes
from enablement import readiness as en_read
from healthchecks import synthetic as hc_synth
from mfg import coq as mfg_coq
from mfg import mrp as mfg_mrp
from mfg import routing as mfg_routing
from mfg import spc as mfg_spc
from mfg import work_instructions as mfg_wi
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
from plm import bom as plm_bom
from plm import eco as plm_eco
from runbooks import executor as rb_executor
from services import catalog as svc_catalog
from services import deps as svc_deps
from status import generator as status_gen
from tools import storage
from aiops import canary as aiops_canary
from aiops import config_drift as aiops_drift
from aiops import correlation as aiops_correlation
from aiops import maintenance as aiops_maintenance
from aiops import remediation as aiops_remediation
from aiops import slo_budget as aiops_budget

VERB_FUN: dict[str, str] = {}
VERB_FUN['plm:bom:where-used'] = 'cli_bom_where_used'

mfg_yield = importlib.import_module("mfg.yield")

from close import calendar as close_calendar
from close import flux as close_flux
from close import journal as close_journal
from close import packet as close_packet
from close import recon as close_recon
from close import sox as close_sox
from orchestrator import orchestrator, slo_report
from orchestrator.perf import perf_timer
from orchestrator.protocols import Task
import settings
from bots import available_bots
from integrations import (
    mappers,
    salesforce_stub,
    sap_stub,
    servicenow_stub,
    workday_stub,
)
from observability import report as obs_report
from orchestrator import metrics, orchestrator, redaction
from orchestrator.protocols import Task
from policy import enforcer
from tools import storage
from tools import storage
from twin import snapshots, replay, stress, compare

from legal import clm, clauses, redline, obligations, compliance_calendar, export_controls, data_room
app = typer.Typer()
from rnd import ideas as rnd_ideas
from rnd import experiments as rnd_exp
from rnd import radar as rnd_radar
from rnd import ip as rnd_ip
from rnd import notes as rnd_notes
from rnd import merge as rnd_merge
from rnd import dashboard as rnd_dashboard

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"


def _next_task_id() -> str:
    counter_path = ARTIFACTS / "last_task_id.txt"
    last = int(storage.read(str(counter_path)) or 0)
    new = last + 1
    if not settings.DRY_RUN:
        storage.write(str(counter_path), str(new))
    return f"T{new:04d}"


@app.callback()
def main(
    ctx: typer.Context,
    dry_run: bool = typer.Option(False, "--dry-run", help="Do not write artifacts"),
):
    settings.DRY_RUN = dry_run


@app.command("bot:run")
def bot_run(
    bot: str = typer.Option(..., "--bot"),
    goal: str = typer.Option(..., "--goal"),
    context: Optional[Path] = typer.Option(None, "--context", exists=True, dir_okay=False),
):
    from orchestrator.protocols import Task

    ctx = json.loads(storage.read(str(context))) if context else None
    task_id = _next_task_id()
    task = Task(id=task_id, goal=goal, context=ctx, created_at=datetime.utcnow())
    response = orchestrator.route(task, bot)
    if settings.DRY_RUN:
        typer.echo("DRY-RUN: no artifacts written")
    else:
        scrubbed_task = Task(
            id=task.id,
            goal=task.goal,
            context=redaction.scrub(task.context) if task.context else None,
            created_at=task.created_at,
        )
        storage.write(
            str(ARTIFACTS / task_id / "task.json"),
            scrubbed_task.model_dump(mode="json"),
        )
        storage.write(
            str(ARTIFACTS / task_id / "response.json"), response.model_dump(mode="json")
        )
    typer.echo(response.summary)


@app.command("policy:check-task")
def policy_check_task(
    goal: str = typer.Option(..., "--goal"),
    context: Optional[Path] = typer.Option(None, "--context", exists=True, dir_okay=False),
):
    ctx_raw = json.loads(storage.read(str(context))) if context else None
    ctx = redaction.scrub(ctx_raw)
    task = Task(id="TCHK", goal=goal, context=ctx, created_at=datetime.utcnow())
    violations = enforcer.check_task(task)
    if violations:
        typer.echo("\n".join(violations))
    else:
        typer.echo("OK")
    from orchestrator import orchestrator
    from orchestrator.protocols import Task

    task_data = json.loads(storage.read(str(ARTIFACTS / id / "task.json")))
    task = Task(**task_data)
    response = orchestrator.route(task, bot)
    storage.write(str(ARTIFACTS / id / "response.json"), response.model_dump(mode="json"))
    typer.echo(response.summary)


@app.command("import:salesforce")
def import_salesforce(fixtures: Path = typer.Option(..., "--fixtures", exists=True, file_okay=False)):
    records = salesforce_stub.load_opportunities(str(fixtures))
    rows = mappers.to_rows(records, ["id", "owner", "stage", "amount", "close_date", "age_days"])
    metrics.inc("importer_runs")
    if not settings.DRY_RUN:
        storage.write(
            str(ARTIFACTS / "imports" / "salesforce.json"), json.dumps(rows)
        )
    else:
        typer.echo("DRY-RUN: no artifacts written")
    typer.echo(f"{len(rows)} rows")


@app.command("import:sap")
def import_sap(fixtures: Path = typer.Option(..., "--fixtures", exists=True, file_okay=False)):
    records = sap_stub.load_gl(str(fixtures))
    rows = mappers.to_rows(records, ["account", "period", "debit", "credit", "entity"])
    metrics.inc("importer_runs")
    if not settings.DRY_RUN:
        storage.write(str(ARTIFACTS / "imports" / "sap_gl.json"), json.dumps(rows))
    else:
        typer.echo("DRY-RUN: no artifacts written")
    typer.echo(f"{len(rows)} rows")


@app.command("import:servicenow")
def import_servicenow(
    fixtures: Path = typer.Option(..., "--fixtures", exists=True, file_okay=False)
):
    records = servicenow_stub.load_incidents(str(fixtures))
    rows = mappers.to_rows(records, ["id", "sev", "opened_at", "closed_at", "service"])
    metrics.inc("importer_runs")
    if not settings.DRY_RUN:
        storage.write(
            str(ARTIFACTS / "imports" / "servicenow.json"), json.dumps(rows)
        )
    else:
        typer.echo("DRY-RUN: no artifacts written")
    typer.echo(f"{len(rows)} rows")


@app.command("import:workday")
def import_workday(fixtures: Path = typer.Option(..., "--fixtures", exists=True, file_okay=False)):
    records = workday_stub.load_headcount(str(fixtures))
    rows = mappers.to_rows(
        records, ["employee_id", "dept", "role", "grade", "region", "start_date", "status"]
    )
    metrics.inc("importer_runs")
    if not settings.DRY_RUN:
        storage.write(str(ARTIFACTS / "imports" / "workday.json"), json.dumps(rows))
    else:
        typer.echo("DRY-RUN: no artifacts written")
    typer.echo(f"{len(rows)} rows")


@app.command("obs:report")
def obs_report_cmd():
    if settings.DRY_RUN:
        typer.echo("DRY-RUN: no artifacts written")
        obs_report.generate()
        return
    obs_report.write_report()
    typer.echo("Report generated")


@app.command("bot:list")
def bot_list():
    from bots import available_bots

    for name, cls in available_bots().items():
        typer.echo(f"{name}\t{cls.mission}")


def _perf_footer(perf: bool, data: dict) -> None:
    if perf:
        typer.echo(f"time={data.get('elapsed_ms')} rss={data.get('rss_mb')} cache=na exec=inproc")
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
def svc_deps_cmd(
    service: str = typer.Option(..., "--service"),
    dir: str = typer.Option("configs/services", "--dir"),
):
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
    ch = change_calendar.Change(
        id=cid, service=service, type=type, start=start, end=end, owner="cli", risk=risk
    )
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


@app.command("close:cal:new")
def close_cal_new(
    period: str = typer.Option(..., "--period"),
    template: Path = typer.Option(..., "--template", exists=True),
):
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
def close_recon_run(
    period: str = typer.Option(..., "--period"),
    fixtures: Path = typer.Option(..., "--fixtures", exists=True),
):
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
def close_sign(
    period: str = typer.Option(..., "--period"),
    role: str = typer.Option(..., "--role"),
    as_user: str = typer.Option(..., "--as-user"),
):
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
def plm_bom_explode(
    item: str = typer.Option(..., "--item"),
    rev: str = typer.Option(..., "--rev"),
    level: int = typer.Option(1, "--level"),
):
    lines = plm_bom.explode(item, rev, level)
    for lvl, comp, qty in lines:
        typer.echo(f"{lvl}\t{comp}\t{qty}")


@app.command("plm:bom:where-used")
def plm_bom_where_used(component: str = typer.Option(..., "--component")):
    rows = plm_bom.where_used(component)
    for item_id, rev in rows:
        typer.echo(f"{item_id}\t{rev}")


@app.command("plm:eco:new")
def plm_eco_new(
    item: str = typer.Option(..., "--item"),
    from_rev: str = typer.Option(..., "--from"),
    to_rev: str = typer.Option(..., "--to"),
    reason: str = typer.Option(..., "--reason"),
):
    ch = plm_eco.new_change(item, from_rev, to_rev, reason)
    typer.echo(ch.id)


@app.command("plm:eco:impact")
def plm_eco_impact(id: str = typer.Option(..., "--id")):
    impact = plm_eco.impact(id)
    typer.echo(f"impact {impact}")


@app.command("plm:eco:approve")
def plm_eco_approve(
    id: str = typer.Option(..., "--id"), as_user: str = typer.Option(..., "--as-user")
):
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
def mfg_routing_load(
    dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False),
    strict: bool = typer.Option(False, "--strict"),
):
    mfg_routing.load_routings(str(dir), strict)
    typer.echo("ok")


@app.command("mfg:routing:capcheck")
def mfg_routing_capcheck(
    item: str = typer.Option(..., "--item"),
    rev: str = typer.Option(..., "--rev"),
    qty: int = typer.Option(..., "--qty"),
):
    res = mfg_routing.capacity_check(item, rev, qty)
    typer.echo(json.dumps(res))


@app.command("mfg:wi:render")
def mfg_wi_render(item: str = typer.Option(..., "--item"), rev: str = typer.Option(..., "--rev")):
    path = mfg_wi.render(item, rev)
    typer.echo(str(path))


@app.command("mfg:spc:analyze")
def mfg_spc_analyze(
    op: str = typer.Option(..., "--op"), window: int = typer.Option(50, "--window")
):
    report = mfg_spc.analyze(op, window)
    if report["findings"]:
        typer.echo(" ".join(report["findings"]))
    else:
        typer.echo("OK")


@app.command("mfg:yield")
def mfg_yield_cmd(period: str = typer.Option(..., "--period")):
    stats = mfg_yield.compute(period)
    typer.echo(json.dumps(stats))


@app.command("mfg:coq")
def mfg_coq_cmd(period: str = typer.Option(..., "--period")):
    totals = mfg_coq.build(period)
    typer.echo(json.dumps(totals))


@app.command("mfg:mrp")
def mfg_mrp_cmd(
    demand: Path = typer.Option(..., "--demand", exists=True),
    inventory: Path = typer.Option(..., "--inventory", exists=True),
    pos: Path = typer.Option(..., "--pos", exists=True),
):
    plan = mfg_mrp.plan(str(demand), str(inventory), str(pos))
    typer.echo(json.dumps(plan))


@app.command("learn:courses:load")
def learn_courses_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    en_courses.load_courses(str(dir))
    typer.echo("ok")


@app.command("learn:courses:list")
def learn_courses_list(role_track: str = typer.Option(..., "--role_track")):
    for c in en_courses.list_courses(role_track):
        typer.echo(f"{c['id']}	{c['title']}")


@app.command("learn:path:new")
def learn_path_new(
    name: str = typer.Option(..., "--name"),
    role_track: str = typer.Option(..., "--role_track"),
    courses: str = typer.Option(..., "--courses"),
    required: int = typer.Option(..., "--required"),
):
    p = en_paths.new_path(name, role_track, courses.split(","), required)
    typer.echo(p.id)


@app.command("learn:assign")
def learn_assign(
    user: str = typer.Option(..., "--user"),
    path: str = typer.Option(..., "--path"),
    due: str = typer.Option(..., "--due"),
):
    en_paths.assign(user, path, due)
    typer.echo("ok")


@app.command("learn:quiz:grade")
def learn_quiz_grade(
    quiz: str = typer.Option(..., "--quiz"),
    answers: Path = typer.Option(..., "--answers", exists=True),
):
    res = en_quizzes.grade(quiz, str(answers))
    typer.echo(json.dumps(res))


@app.command("learn:lab:run")
def learn_lab_run(
    lab: str = typer.Option(..., "--lab"),
    submission: Path = typer.Option(..., "--submission", exists=True),
):
    res = en_labs.run_lab(lab, str(submission))
    typer.echo(json.dumps(res))


@app.command("learn:cert:check")
def learn_cert_check(
    user: str = typer.Option(..., "--user"), cert: str = typer.Option(..., "--cert")
):
    ok = en_cert.check(user, cert)
    typer.echo("awarded" if ok else "not met")


@app.command("learn:cert:list")
def learn_cert_list(user: str = typer.Option(..., "--user")):
    for c in en_cert.list_user(user):
        typer.echo(c)


@app.command("learn:readiness")
def learn_readiness():
    en_read.build()
    typer.echo("ok")


@app.command("learn:event:add")
def learn_event_add(
    title: str = typer.Option(..., "--title"),
    type: str = typer.Option(..., "--type"),
    date: str = typer.Option(..., "--date"),
    capacity: int = typer.Option(..., "--capacity"),
):
    ev = en_cal.add_event(title, type, date, capacity)
    typer.echo(ev.id)


@app.command("learn:event:join")
def learn_event_join(id: str = typer.Option(..., "--id"), user: str = typer.Option(..., "--user")):
    en_cal.join(id, user)
    typer.echo("ok")


@app.command("learn:feedback:add")
def learn_feedback_add(
    course: str = typer.Option(..., "--course"),
    user: str = typer.Option(..., "--user"),
    score: int = typer.Option(..., "--score"),
    comment: str = typer.Option(..., "--comment"),
):
    en_fb.add(course, user, score, comment)
    typer.echo("ok")


@app.command("learn:feedback:summary")
def learn_feedback_summary(course: str = typer.Option(..., "--course")):
    res = en_fb.summary(course)
    typer.echo(json.dumps(res))


@app.command("status:build")
def status_build():
    status_gen.build()
    typer.echo("built")
@app.command("aiops:correlate")
def aiops_correlate():
    aiops_correlation.correlate(datetime.utcnow())


@app.command("aiops:plan")
def aiops_plan(correlations: str = typer.Option(..., "--correlations")):
    corr = aiops_remediation.load_correlations(correlations)
    aiops_remediation.plan(corr)


@app.command("aiops:execute")
def aiops_execute(
    plan: Path = typer.Option(..., "--plan", exists=True, dir_okay=False),
    dry_run: bool = typer.Option(False, "--dry-run"),
):
    aiops_remediation.execute(plan, dry_run)


@app.command("aiops:canary")
def aiops_canary_cmd(
    base: Path = typer.Option(..., "--base", exists=True, dir_okay=False),
    canary: Path = typer.Option(..., "--canary", exists=True, dir_okay=False),
):
    aiops_canary.analyze(base, canary)


@app.command("aiops:baseline:record")
def aiops_baseline_record():
    aiops_drift.record_baseline({})


@app.command("aiops:drift:check")
def aiops_drift_check():
    aiops_drift.compare()


@app.command("aiops:budget")
def aiops_budget_cmd(service: str = typer.Option(..., "--service"), window: str = typer.Option(..., "--window")):
    aiops_budget.budget_status(service, window)


@app.command("aiops:window")
def aiops_window(service: str = typer.Option(..., "--service"), action: str = typer.Option(..., "--action")):
    w = aiops_maintenance.next_window(service, action)
    typer.echo(json.dumps(w) if w else "null")
@app.command("ir:kpi:compute")
def ir_kpi_compute(period: str = typer.Option(..., "--period")):
    from ir import kpi_sot

    rows = kpi_sot.compute(period)
    typer.echo(json.dumps(rows, indent=2))


@app.command("ir:kpi:signoff")
def ir_kpi_signoff(
    kpi: str = typer.Option(..., "--kpi"),
    period: str = typer.Option(..., "--period"),
):
    from ir import kpi_signoff

    kpi_signoff.request_signoff(kpi, period)


@app.command("ir:kpi:approve")
def ir_kpi_approve(
    kpi: str = typer.Option(..., "--kpi"),
    period: str = typer.Option(..., "--period"),
    as_user: str = typer.Option(..., "--as-user"),
):
    from ir import kpi_signoff

    kpi_signoff.approve(kpi, period, as_user)


@app.command("ir:kpi:reject")
def ir_kpi_reject(
    kpi: str = typer.Option(..., "--kpi"),
    period: str = typer.Option(..., "--period"),
    as_user: str = typer.Option(..., "--as-user"),
):
    from ir import kpi_signoff

    kpi_signoff.reject(kpi, period, as_user)


@app.command("ir:earnings:build")
def ir_earnings_build(
    period: str = typer.Option(..., "--period"),
    as_user: str = typer.Option(..., "--as-user"),
):
    from ir import earnings

    earnings.build(period, user=as_user)


@app.command("ir:guidance")
def ir_guidance_run(
    period: str = typer.Option(..., "--period"),
    assumptions: Path = typer.Option(..., "--assumptions", exists=True, dir_okay=False),
):
    from ir import guidance

    guidance.run(period, assumptions)


@app.command("ir:blackouts:status")
def ir_blackouts_status(date: str = typer.Option(..., "--date")):
    from ir import blackouts

    code = blackouts.status(date)
    typer.echo(code or "CLEAR")


@app.command("ir:disclose")
def ir_disclose(
    type: str = typer.Option(..., "--type"),
    path: Path = typer.Option(..., "--path", exists=True, dir_okay=False),
    as_user: str = typer.Option(..., "--as-user"),
):
    from ir import disclosures

    disclosures.log_disclosure(type, str(path), as_user)


@app.command("board:pack")
def board_pack_cmd(month: str = typer.Option(..., "--month")):
    from board import pack

    pack.build(month)


@app.command("ir:faq")
def ir_faq(
    q: str = typer.Option(..., "--q"),
    mode: str = typer.Option("internal", "--mode"),
    as_user: str = typer.Option("U_IR", "--as-user"),
):
    from ir import faq_bot

    resp = faq_bot.answer(q, mode=mode, user=as_user)
    typer.echo(json.dumps(resp, indent=2))
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
@app.command("twin:checkpoint")
def twin_checkpoint(name: str = typer.Option(..., "--name")):
    path = snapshots.create_checkpoint(name)
    typer.echo(path)


@app.command("twin:list")
def twin_list():
    for info in snapshots.list_checkpoints():
        typer.echo(f"{info['name']}\t{info['created_at']}")


@app.command("twin:restore")
def twin_restore(name: str = typer.Option(..., "--name")):
    snapshots.restore_checkpoint(name)
    typer.echo("restored")


@app.command("twin:replay")
def twin_replay(
    range_from: Optional[str] = typer.Option(None, "--from"),
    range_to: Optional[str] = typer.Option(None, "--to"),
    mode: str = typer.Option("verify", "--mode"),
):
    report = replay.replay(range_from, range_to, mode=mode)
    typer.echo(str(report))


@app.command("twin:stress")
def twin_stress(
    profile: str = typer.Option("default", "--profile"),
    duration: int = typer.Option(60, "--duration"),
):
    prof = stress.load_profile(profile)
    stress.run_load(prof, duration)
    typer.echo("ok")


@app.command("twin:compare")
def twin_compare(
    left: str = typer.Option(..., "--left"),
    right: str = typer.Option(..., "--right"),
):
    res = compare.compare_runs(left, right)
    typer.echo(str(res))


if __name__ == "__main__":

@app.command("rnd:idea:new")
def rnd_idea_new(title: str = typer.Option(..., "--title"), problem: str = typer.Option(..., "--problem"), solution: str = typer.Option(..., "--solution"), owner: str = typer.Option(..., "--owner"), tags: str = typer.Option("", "--tags"), status: str = typer.Option("new", "--status")):
    idea = rnd_ideas.new(title, problem, solution, owner, [t.strip() for t in tags.split(",") if t.strip()], status)
    typer.echo(idea.id)


@app.command("rnd:idea:score")
def rnd_idea_score(id: str = typer.Option(..., "--id")):
    idea = next((i for i in rnd_ideas.list() if i.id == id), None)
    if not idea:
        raise typer.Exit(code=1)
    typer.echo(str(rnd_ideas.score(idea)))


@app.command("rnd:idea:list")
def rnd_idea_list(status: Optional[str] = typer.Option(None, "--status")):
    for i in rnd_ideas.list(status):
        typer.echo(f"{i.id}\t{i.title}\t{i.status}")


@app.command("rnd:exp:design")
def rnd_exp_design(idea: str = typer.Option(..., "--idea"), hypothesis: str = typer.Option(..., "--hypothesis"), method: str = typer.Option(..., "--method")):
    exp = rnd_exp.design(idea, hypothesis, method)
    typer.echo(exp.id)


@app.command("rnd:exp:run")
def rnd_exp_run_cmd(id: str = typer.Option(..., "--id")):
    rnd_exp.run(id)
    typer.echo("ran")


@app.command("rnd:exp:decide")
def rnd_exp_decide(id: str = typer.Option(..., "--id"), decision: str = typer.Option(..., "--decision"), reason: str = typer.Option(..., "--reason")):
    rnd_exp.decide(id, decision, reason)
    typer.echo("ok")


@app.command("rnd:radar:build")
def rnd_radar_build():
    rnd_radar.build()
    typer.echo("built")


@app.command("rnd:radar:add")
def rnd_radar_add(tech: str = typer.Option(..., "--tech"), ring: str = typer.Option(..., "--ring"), quadrant: str = typer.Option(..., "--quadrant"), rationale: str = typer.Option(..., "--rationale")):
    rnd_radar.add(tech, ring, quadrant, rationale)
    typer.echo("added")


@app.command("rnd:radar:list")
def rnd_radar_list(quadrant: Optional[str] = typer.Option(None, "--quadrant")):
    for e in rnd_radar.list(quadrant):
        typer.echo(f"{e.tech}\t{e.ring}\t{e.quadrant}")


@app.command("rnd:ip:new")
def rnd_ip_new(idea: str = typer.Option(..., "--idea"), title: str = typer.Option(..., "--title"), inventors: str = typer.Option(..., "--inventors"), jurisdictions: str = typer.Option(..., "--jurisdictions")):
    disc = rnd_ip.new(idea, title, inventors.split(","), jurisdictions.split(","))
    typer.echo(disc.id)


@app.command("rnd:ip:update")
def rnd_ip_update(id: str = typer.Option(..., "--id"), status: str = typer.Option(..., "--status")):
    rnd_ip.update(id, status)
    typer.echo("ok")


@app.command("rnd:notes:index")
def rnd_notes_index_cmd():
    rnd_notes.index()
    typer.echo("indexed")


@app.command("rnd:notes:link")
def rnd_notes_link(idea: str = typer.Option(..., "--idea"), note: Path = typer.Option(..., "--note", exists=True)):
    rnd_notes.link(idea, str(note))
    typer.echo("linked")


@app.command("rnd:merge")
def rnd_merge_cmd(idea: str = typer.Option(..., "--idea")):
    rnd_merge.merge(idea)
    typer.echo("merged")


@app.command("rnd:dashboard")
def rnd_dashboard_cmd():
    rnd_dashboard.build()
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


def main():
    app()
import argparse
import json
from pathlib import Path

from samples import gen as sample_gen

COOKBOOK_DIR = Path("cookbook/tasks")
ARTIFACT_DIR = Path("artifacts/cookbook")


def _list_cookbook():
    return [p.stem for p in COOKBOOK_DIR.glob("*.md")]


def cmd_samples(args):
    sample_gen.main(args.overwrite)
    print("samples generated at", sample_gen.GENERATED_DIR)


def cmd_bot(args):
    print(f"running bot {args.bot} for goal '{args.goal}'")


def _parse_context(text: str) -> dict:
    import re

    match = re.search(r"```json\n(.*?)\n```", text, re.S)
    if match:
        return json.loads(match.group(1))
    return {}


def cmd_cookbook(args):
    slug = args.name
    path = COOKBOOK_DIR / f"{slug}.md"
    if not path.exists():
        print("unknown cookbook name", slug)
        print("available:", ", ".join(_list_cookbook()))
        return
    text = path.read_text()
    context = _parse_context(text)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = ARTIFACT_DIR / f"{slug}.json"
    with out_path.open("w") as f:
        json.dump({"goal": slug, "context": context}, f, indent=2)
    print(out_path)


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")

    p_samples = sub.add_parser("samples:gen")
    p_samples.add_argument("--overwrite", action="store_true")
    p_samples.set_defaults(func=cmd_samples)

    p_bot = sub.add_parser("bot:run")
    p_bot.add_argument("--bot", required=True)
    p_bot.add_argument("--goal", required=True)
    p_bot.set_defaults(func=cmd_bot)

    p_cb = sub.add_parser("cookbook:run")
    p_cb.add_argument("--name")
    p_cb.set_defaults(func=cmd_cookbook)

    args = parser.parse_args()
    if hasattr(args, "func"):
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
from __future__ import annotations

import argparse
import json
import sys

from orchestrator import audit, approvals, tasks
from orchestrator.exceptions import BotExecutionError
from security import rbac
from security.rbac import APPROVAL_DECIDE, APPROVAL_REQUEST, TASK_CREATE, TASK_ROUTE
from tools import storage

BOTS = ["Treasury-BOT", "Change/Release-BOT", "SRE-BOT"]


def parse_user(user_id: str) -> rbac.User:
    return rbac.rbac.get_user(user_id)


def cmd_bot_list(args: argparse.Namespace, *, user: rbac.User) -> None:
    for b in BOTS:
        print(b)


@rbac.require([TASK_CREATE])
def cmd_task_create(args: argparse.Namespace, *, user: rbac.User) -> None:
    context = {}
    if args.context:
        context = storage.read_json(args.context, from_data=False)
    task = tasks.create_task(args.goal, context, user=user)
    print(task.id)


@rbac.require([TASK_ROUTE])
def cmd_task_route(args: argparse.Namespace, *, user: rbac.User) -> None:
    try:
        task = tasks.route_task(args.id, args.bot, user=user)
        print(task.status)
    except BotExecutionError as e:
        print(str(e))
        sys.exit(1)


@rbac.require([APPROVAL_REQUEST])
def cmd_approval_create(args: argparse.Namespace, *, user: rbac.User) -> None:
    req = approvals.create_approval(args.task, user.id, args.for_role)
    print(req.id)


@rbac.require([APPROVAL_DECIDE])
def cmd_approval_decide(args: argparse.Namespace, *, user: rbac.User) -> None:
    req = approvals.decide(args.id, args.decision, user.id, args.reason)
    print(req.status)


@rbac.require([APPROVAL_DECIDE])
def cmd_approval_list(args: argparse.Namespace, *, user: rbac.User) -> None:
    items = approvals.list_approvals(args.status)
    for item in items:
        print(json.dumps(item.__dict__))


@rbac.require([rbac.ADMIN])
def cmd_audit_verify(args: argparse.Namespace, *, user: rbac.User) -> None:
    bad = audit.verify_log()
    if bad:
        print("invalid signatures at lines", bad)
        sys.exit(1)
    print("all signatures valid")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd")

    def add_user(sp: argparse.ArgumentParser) -> None:
        sp.add_argument("--as-user", dest="as_user", default="U_SYS")

    sub_bot = sub.add_parser("bot:list")
    add_user(sub_bot)
    sub_bot.set_defaults(func=cmd_bot_list)

    sub_create = sub.add_parser("task:create")
    add_user(sub_create)
    sub_create.add_argument("--goal", required=True)
    sub_create.add_argument("--context")
    sub_create.set_defaults(func=cmd_task_create)

    sub_route = sub.add_parser("task:route")
    add_user(sub_route)
    sub_route.add_argument("--id", required=True)
    sub_route.add_argument("--bot", required=True)
    sub_route.set_defaults(func=cmd_task_route)

    sub_acreate = sub.add_parser("approval:create")
    add_user(sub_acreate)
    sub_acreate.add_argument("--task", required=True)
    sub_acreate.add_argument("--for-role", dest="for_role", required=True)
    sub_acreate.set_defaults(func=cmd_approval_create)

    sub_alist = sub.add_parser("approval:list")
    add_user(sub_alist)
    sub_alist.add_argument("--status")
    sub_alist.set_defaults(func=cmd_approval_list)

    sub_adecide = sub.add_parser("approval:decide")
    add_user(sub_adecide)
    sub_adecide.add_argument("--id", required=True)
    sub_adecide.add_argument("--decision", required=True)
    sub_adecide.add_argument("--reason")
    sub_adecide.set_defaults(func=cmd_approval_decide)

    sub_verify = sub.add_parser("audit:verify")
    add_user(sub_verify)
    sub_verify.set_defaults(func=cmd_audit_verify)

    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    user = parse_user(args.as_user)
    try:
        if not args.cmd:
            parser.print_help()
            return 0
        args.func(args, user=user)
        return 0
    except rbac.PermissionError as e:
        print(str(e))
        return 2


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
