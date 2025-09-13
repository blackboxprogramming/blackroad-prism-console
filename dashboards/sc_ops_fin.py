from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "dashboards"


def build(d: Dict) -> None:
    ART_DIR.mkdir(parents=True, exist_ok=True)
    md_path = ART_DIR / "sc_ops_fin.md"
    html_path = ART_DIR / "sc_ops_fin.html"
    md_content = """# Supply Chain & Finance Twin\n\n"""
    for k, v in d.items():
        md_content += f"- {k}: {v}\n"
    html_content = f"<html><body><pre>{md_content}</pre></body></html>"
    md_path.write_text(md_content, encoding="utf-8")
    html_path.write_text(html_content, encoding="utf-8")
