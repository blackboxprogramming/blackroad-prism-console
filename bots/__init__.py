"""Bot registry and utilities."""
import importlib
import pkgutil
from typing import Dict, Type

from orchestrator.base import BaseBot


def available_bots() -> Dict[str, Type[BaseBot]]:
    """Discover available bots in this package."""
    bots: Dict[str, Type[BaseBot]] = {}
    package_path = __path__  # type: ignore[name-defined]
    for module in pkgutil.iter_modules(package_path):
        mod = importlib.import_module(f"{__name__}.{module.name}")
        for attr in dir(mod):
            obj = getattr(mod, attr)
            if isinstance(obj, type) and issubclass(obj, BaseBot) and obj is not BaseBot:
                bots[obj.name] = obj
    return bots
