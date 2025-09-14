from __future__ import annotations

import json
from pathlib import Path

import typer

from supply import logistics_tracker, po_manager, risk_engine, vendor_registry

app = typer.Typer()
vendor_app = typer.Typer()
po_app = typer.Typer()
risk_app = typer.Typer()
log_app = typer.Typer()

app.add_typer(vendor_app, name="vendor")
app.add_typer(po_app, name="po")
app.add_typer(risk_app, name="risk")
app.add_typer(log_app, name="logistics")


@vendor_app.command("list")
def vendor_list() -> None:
    for v in vendor_registry.list_vendors():
        typer.echo(f"{v.id}\t{v.category}\t{v.risk_rating}")


@vendor_app.command("upsert")
def vendor_upsert(
    id: str,
    category: str,
    approvals: str = typer.Option("", "--approvals"),
    risk_rating: str = typer.Option("unknown", "--risk-rating"),
) -> None:
    vendor = vendor_registry.Vendor(
        id=id,
        category=category,
        approvals=[a.strip() for a in approvals.split(",") if a],
        risk_rating=risk_rating,
    )
    vendor_registry.upsert_vendor(vendor)


@vendor_app.command("audit")
def vendor_audit(id: str, note: str = typer.Option(..., "--note")) -> None:
    vendor_registry.record_audit(id, note)


@po_app.command("create")
def po_create(vendor: str, items: str) -> None:
    data = json.loads(items)
    po = po_manager.create_po(vendor, data)
    typer.echo(po.id)


@po_app.command("approve")
def po_approve(id: str) -> None:
    po_manager.approve_po(id)


@po_app.command("receive")
def po_receive(id: str) -> None:
    po_manager.receive_po(id)


@po_app.command("close")
def po_close(id: str) -> None:
    po_manager.close_po(id)


@po_app.command("export")
def po_export(id: str, out: Path) -> None:
    po_manager.export_po_pdf(id, out)


@risk_app.command("update")
def risk_update(vendor: str, factors: str) -> None:
    risk_engine.update_risk(vendor, json.loads(factors))


@risk_app.command("show")
def risk_show(vendor: str) -> None:
    typer.echo(json.dumps(risk_engine.get_risk(vendor), indent=2))


@log_app.command("add")
def logistics_add(
    id: str,
    vendor: str,
    items: str,
    carrier: str,
    incoterms: str,
    eta: str,
) -> None:
    shipment = logistics_tracker.Shipment(
        id=id,
        vendor=vendor,
        items=json.loads(items),
        carrier=carrier,
        incoterms=incoterms,
        eta=eta,
    )
    logistics_tracker.add_shipment(shipment)


@log_app.command("list")
def logistics_list() -> None:
    for s in logistics_tracker.list_shipments():
        typer.echo(f"{s.id}\t{s.vendor}\t{s.eta}")


@log_app.command("map")
def logistics_map(vendor: str, deps: str) -> None:
    logistics_tracker.update_tier_mapping(vendor, json.loads(deps))


@log_app.command("map-show")
def logistics_map_show() -> None:
    typer.echo(json.dumps(logistics_tracker.get_tier_mapping(), indent=2))


def main() -> None:
    app()


if __name__ == "__main__":
    main()
