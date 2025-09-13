import json
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List

from tools import artifacts, metrics, storage

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = ROOT / "artifacts/marketing/seo"
LAKE = ROOT / "artifacts/lake"
CONTRACTS = ROOT / "contracts/schemas"


class _Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.h1 = False
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        if tag == "h1":
            self.h1 = True
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data.strip()


def audit_site(path: str) -> Dict[str, List[str]]:
    site = Path(path)
    issues: List[dict] = []
    titles: Dict[str, List[str]] = {}
    for file in site.glob("*.html"):
        parser = _Parser()
        parser.feed(Path(file).read_text())
        titles.setdefault(parser.title, []).append(file.name)
        if not parser.h1:
            issues.append({"file": file.name, "code": "SEO_NO_H1"})
    for title, files in titles.items():
        if len(files) > 1:
            for f in files:
                issues.append({"file": f, "code": "SEO_DUP_TITLE"})
    artifacts.validate_and_write(
        str(ARTIFACTS_DIR / "issues.json"), issues
    )
    lines = ["# SEO Report", f"issues: {len(issues)}"]
    storage.write(str(ARTIFACTS_DIR / "report.md"), "\n".join(lines))
    for issue in issues:
        artifacts.validate_and_write(
            str(LAKE / "seo_issues.jsonl"),
            issue,
            schema_path=str(CONTRACTS / "seo_issues.schema.json"),
        )
    metrics.emit("seo_issues_found", len(issues))
    return {i["file"]: i["code"] for i in issues}
