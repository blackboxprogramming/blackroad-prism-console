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

# phase 25 additions
from partners import catalog as partner_catalog
from partners import certify as partner_certify
from partners import orders as partner_orders
from licensing import sku_packs, keys as license_keys, entitlements as entitlement_engine
from billing import invoices as billing_invoices

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


# partner catalog commands
@app.command("partner:load")
def partner_load(dir: Path = typer.Option(..., "--dir", exists=True, file_okay=False)):
    partner_catalog.load_catalog(dir)


@app.command("partner:list")
def partner_list(
    tier: Optional[str] = typer.Option(None, "--tier"),
    region: Optional[str] = typer.Option(None, "--region"),
):
    for p in partner_catalog.list_partners(tier=tier, region=region):
        typer.echo(f"{p['id']}\t{p['name']}")


@app.command("partner:show")
def partner_show(pid: str = typer.Option(..., "--id")):
    p = partner_catalog.show_partner(pid)
    typer.echo(json.dumps(p, indent=2))


# sku commands
@app.command("sku:list")
def sku_list():
    for sku in sku_packs.load_skus().keys():
        typer.echo(sku)


@app.command("sku:show")
def sku_show(sku: str = typer.Option(..., "--sku")):
    pack = sku_packs.load_skus().get(sku)
    typer.echo(json.dumps(pack.__dict__, indent=2))


# license key commands
@app.command("license:gen")
def license_gen(
    tenant: str = typer.Option(..., "--tenant"),
    sku: str = typer.Option(..., "--sku"),
    seats: int = typer.Option(..., "--seats"),
    start: str = typer.Option(..., "--start"),
    end: str = typer.Option(..., "--end"),
):
    key = license_keys.generate_key(tenant, sku, seats, start, end)
    typer.echo(key)


@app.command("license:verify")
def license_verify(key: str = typer.Option(..., "--key")):
    payload = license_keys.verify_key(key)
    typer.echo(json.dumps(payload, indent=2))


# entitlement commands
@app.command("entitlement:add")
def entitlement_add(
    tenant: str = typer.Option(None, "--tenant"),
    sku: str = typer.Option(None, "--sku"),
    seats: int = typer.Option(0, "--seats"),
    start: str = typer.Option("", "--start"),
    end: str = typer.Option("", "--end"),
    from_key: str = typer.Option(None, "--from-key"),
):
    if from_key:
        entitlement_engine.add_from_key(from_key)
    else:
        entitlement_engine.add_entitlement(tenant, sku, seats, start, end)


@app.command("entitlement:resolve")
def entitlement_resolve(tenant: str = typer.Option(..., "--tenant")):
    res = entitlement_engine.resolve(tenant)
    typer.echo(json.dumps(res, indent=2))


# billing commands
@app.command("bill:run")
def bill_run(period: str = typer.Option(..., "--period")):
    billing_invoices.run(period)


@app.command("bill:show")
def bill_show(invoice: str = typer.Option(..., "--invoice")):
    inv = billing_invoices.show(invoice)
    typer.echo(json.dumps(inv, indent=2))


# certification
@app.command("cert:take")
def cert_take(
    partner: str = typer.Option(..., "--partner"),
    exam: str = typer.Option(..., "--exam"),
    answers: Path = typer.Option(..., "--answers", exists=True, file_okay=True, dir_okay=False),
):
    attempt = partner_certify.grade(partner, exam, answers)
    typer.echo(attempt.status)


@app.command("cert:status")
def cert_status(partner: str = typer.Option(..., "--partner")):
    typer.echo(json.dumps(partner_certify.status(partner), indent=2))


# marketplace orders
@app.command("market:order")
def market_order(
    tenant: str = typer.Option(..., "--tenant"),
    listing: str = typer.Option(..., "--listing"),
    qty: int = typer.Option(1, "--qty"),
):
    order = partner_orders.place_order(tenant, listing, qty)
    typer.echo(order.id)


@app.command("market:provision")
def market_provision(order: str = typer.Option(..., "--order")):
    order_obj = partner_orders.provision(order)
    typer.echo(order_obj.status)


if __name__ == "__main__":
    app()
