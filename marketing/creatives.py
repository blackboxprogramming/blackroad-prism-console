from pathlib import Path

from tools import storage


def generate_variants(in_path: str, out_dir: str) -> None:
    src = Path(in_path).read_text()
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    storage.write(str(out / "orig.md"), src)
    storage.write(str(out / "short.md"), (src[:50] + ("..." if len(src) > 50 else "")))
    storage.write(str(out / "long.md"), src + "\n[Extra details]")
    storage.write(str(out / "cta.md"), src.replace("Click here", "Learn more"))
    if src.startswith("# "):
        first, rest = src.split("\n", 1)
        storage.write(str(out / "headline_b.md"), first + " - Alt\n" + rest)
