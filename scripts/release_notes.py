import json
from pathlib import Path
from typing import Dict, List

SECTIONS = [
    ("Features", "features"),
    ("Fixes", "fixes"),
    ("Breaking Changes", "breaking"),
    ("Docs", "docs"),
    ("Tests", "tests"),
]


def load_notes(path: Path) -> Dict[str, List[str]]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text())
        return {k.lower(): v for k, v in data.items()}
    except Exception:
        return {}


def generate(version: str, dist_dir: Path, notes_file: Path) -> Path:
    notes = load_notes(notes_file)
    lines = [f"# Release Notes for {version}"]
    for title, key in SECTIONS:
        lines.append(f"\n## {title}")
        items = notes.get(key, [])
        if items:
            for item in items:
                lines.append(f"- {item}")
        else:
            lines.append("- None")
    output = dist_dir / f"release-notes-{version}.md"
    output.write_text("\n".join(lines) + "\n")
    return output


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--version", required=True)
    p.add_argument("--notes", default="scripts/notes.yml")
    p.add_argument("--out", default="dist")
    ns = p.parse_args()
    out_dir = Path(ns.out)
    out_dir.mkdir(exist_ok=True)
    generate(ns.version, out_dir, Path(ns.notes))
