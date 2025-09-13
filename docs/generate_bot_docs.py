import importlib
import pkgutil
from pathlib import Path
from typing import Dict, List


def discover_bots() -> Dict[str, List[dict]]:
    bots_pkg = importlib.import_module("bots")
    pkg_path = Path(bots_pkg.__file__).parent
    bots: Dict[str, List[dict]] = {}
    for module in pkgutil.iter_modules([str(pkg_path)]):
        mod = importlib.import_module(f"bots.{module.name}")
        caps = getattr(mod, "CAPABILITIES", None)
        if caps:
            bots[module.name] = caps
    return bots


def generate_docs(output_dir: str = "docs/bots") -> Dict[str, List[dict]]:
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    bots = discover_bots()
    for name, caps in bots.items():
        with open(out_path / f"{name}.md", "w") as f:
            f.write(f"# {name}\n\n")
            f.write("| intent | inputs_schema | outputs_schema |\n")
            f.write("| --- | --- | --- |\n")
            for cap in caps:
                f.write(
                    f"| {cap['intent']} | {cap['inputs_schema']} | {cap['outputs_schema']} |\n"
                )
    return bots
