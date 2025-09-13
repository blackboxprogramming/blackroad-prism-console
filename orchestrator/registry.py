import importlib
import pkgutil
from pathlib import Path
from typing import Optional, Type

from sdk import plugin_api

BOT_REGISTRY = plugin_api.BOT_REGISTRY


def _load_modules_from(path: Path, package: str) -> None:
    if not path.exists():
        return
    for module in pkgutil.iter_modules([str(path)]):
        importlib.import_module(f"{package}.{module.name}")


def load_all() -> None:
    base = Path(__file__).resolve().parent.parent
    _load_modules_from(base / "bots", "bots")
    _load_modules_from(base / "plugins", "plugins")


load_all()


def get_bot(name: str) -> Optional[Type[plugin_api.BaseBot]]:
    return BOT_REGISTRY.get(name)
