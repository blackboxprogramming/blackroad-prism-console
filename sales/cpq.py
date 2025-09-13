from dataclasses import dataclass
from typing import List, Dict, Any
from pathlib import Path
import json

from . import catalog


@dataclass
class ConfiguredLine:
    sku: str
    qty: int
    options: Dict[str, Any]


@dataclass
class PricedLine(ConfiguredLine):
    unit_price: float
    line_total: float


@dataclass
class PricedQuote:
    lines: List[PricedLine]
    total: float


def configure(order_lines: List[Dict[str, Any]]) -> List[ConfiguredLine]:
    return [ConfiguredLine(**ol) for ol in order_lines]


def _price_for_sku(sku: str, qty: int, region: str, currency: str) -> float:
    catalog_data = catalog.load_artifact()
    for pb in catalog_data.get("pricebook", []):
        if pb["sku"] == sku and pb["region"] == region and pb["currency"] == currency:
            price = pb["base_price"]
            for tier in sorted(pb.get("tiers", []), key=lambda t: t["min_qty"]):
                if qty >= tier["min_qty"]:
                    price = tier["unit_price"]
            return price
    raise ValueError(f"No price for {sku}")


def price(configured: List[ConfiguredLine], region: str, currency: str, policies: Dict[str, Any] | None = None) -> PricedQuote:
    policies = policies or {}
    priced_lines: List[PricedLine] = []
    for line in configured:
        unit = _price_for_sku(line.sku, line.qty, region, currency)
        if line.options.get("bundle") and policies.get("bundle_discount_pct"):
            unit *= 1 - policies["bundle_discount_pct"] / 100
        unit = round(unit, 2)
        line_total = round(unit * line.qty, 2)
        priced_lines.append(PricedLine(**line.__dict__, unit_price=unit, line_total=line_total))
    total = round(sum(l.line_total for l in priced_lines), 2)
    return PricedQuote(lines=priced_lines, total=total)


def save_quote(quote: PricedQuote, path: Path) -> None:
    data = {
        "lines": [l.__dict__ for l in quote.lines],
        "total": quote.total,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2))
    # simple markdown summary
    md_lines = ["| SKU | Qty | Unit | Total |", "|---|---:|---:|---:|"]
    for l in quote.lines:
        md_lines.append(f"|{l.sku}|{l.qty}|{l.unit_price:.2f}|{l.line_total:.2f}|")
    md_lines.append(f"|Total|||{quote.total:.2f}|")
    (path.with_suffix(".md")).write_text("\n".join(md_lines))
