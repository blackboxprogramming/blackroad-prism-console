from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import json

from tools import storage
from . import guardrails

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "sales" / "deals"


@dataclass
class Deal:
    id: str
    account: str
    quote_path: str
    requested_discount: float
    status: str
    approvals: List[Dict[str, Any]]
    created_at: str


def _next_id() -> str:
    counter = ROOT / "artifacts" / "sales" / "deal_counter.txt"
    last = int(storage.read(str(counter)) or 0)
    new = last + 1
    storage.write(str(counter), str(new))
    return f"D{new:03d}"


def new_deal(account: str, quote_path: Path, requested_discount: float) -> Deal:
    deal_id = _next_id()
    deal = Deal(
        id=deal_id,
        account=account,
        quote_path=str(quote_path),
        requested_discount=requested_discount,
        status="pending",
        approvals=[],
        created_at=datetime.utcnow().isoformat(),
    )
    save_deal(deal)
    return deal


def load_deal(deal_id: str) -> Deal:
    data = json.loads((ART / f"{deal_id}.json").read_text())
    return Deal(**data)


def save_deal(deal: Deal) -> None:
    ART.mkdir(parents=True, exist_ok=True)
    (ART / f"{deal.id}.json").write_text(json.dumps(asdict(deal), indent=2))
    (ART / f"deal_{deal.id}.md").write_text(f"Deal {deal.id} for {deal.account}\nStatus: {deal.status}\n")


def check_deal(deal: Deal) -> List[str]:
    quote = json.loads(Path(deal.quote_path).read_text())
    if deal.requested_discount:
        for line in quote.get("lines", []):
            line["unit_price"] = round(
                line["unit_price"] * (1 - deal.requested_discount / 100), 2
            )
            line["line_total"] = round(line["unit_price"] * line["qty"], 2)
    violations = guardrails.check(quote)
    return [v.code for v in violations]


def request_approval(deal: Deal, role: str) -> None:
    deal.approvals.append({"role": role, "approved": False})
    save_deal(deal)


def status(deal: Deal) -> str:
    return deal.status
