from pathlib import Path
import json
import os
from typing import Dict, Any


def build_pack(quote_path: Path, account: str, out_dir: Path) -> Dict[str, str]:
    quote = json.loads(quote_path.read_text())
    if quote.get("contacts") and os.getenv("PRIVACY_OK") != "1":
        raise ValueError("DUTY_PRIVACY_QP")
    out_dir.mkdir(parents=True, exist_ok=True)
    cover = out_dir / "cover.md"
    cover.write_text(f"# Quote for {account}\n")
    table = out_dir / "pricing_table.md"
    md_lines = ["| SKU | Qty | Unit | Total |", "|---|---:|---:|---:|"]
    for line in quote.get("lines", []):
        md_lines.append(
            f"|{line['sku']}|{line['qty']}|{line['unit_price']:.2f}|{line['line_total']:.2f}|"
        )
    md_lines.append(f"|Total|||{quote.get('total',0):.2f}|")
    table.write_text("\n".join(md_lines))
    terms = out_dir / "terms.md"
    terms.write_text("Standard terms apply.")
    slides = out_dir / "slides.md"
    slides.write_text("Slides unavailable.")
    return {
        "cover": str(cover),
        "pricing_table": str(table),
        "terms": str(terms),
    }
