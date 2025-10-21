from __future__ import annotations

import json
import os
from pathlib import Path
from threading import RLock
from typing import Any, Dict, Iterator, Mapping, Optional


class ConfigView(Mapping[str, Any]):
    """Mapping proxy that also provides attribute-style access."""

    def __init__(self, data: Mapping[str, Any]):
        self._data = dict(data)

    def __getattr__(self, item: str) -> Any:
        try:
            return self._data[item]
        except KeyError as exc:  # pragma: no cover - defensive
            raise AttributeError(item) from exc

    # Mapping protocol
    def __getitem__(self, key: str) -> Any:
        return self._data[key]

    def __iter__(self) -> Iterator[str]:
        return iter(self._data)

    def __len__(self) -> int:
        return len(self._data)

    def to_dict(self) -> Dict[str, Any]:
        return dict(self._data)


class ConfigHolder:
    """Loads and exposes the autopal configuration."""

    def __init__(self, path: Optional[Path | str] = None, *, initial: Optional[Mapping[str, Any]] = None):
        env_path = os.environ.get("AUTOPAL_CONFIG")
        base_path = Path(__file__).resolve().parent.parent
        default_path = base_path / "autopal.config.json"
        if path is None:
            path = env_path or default_path
        self._path = Path(path)
        self._lock = RLock()
        if initial is not None:
            data = dict(initial)
        else:
            data = self._load()
        self._current = ConfigView(data)

    @property
    def current(self) -> ConfigView:
        return self._current

    def reload(self) -> None:
        with self._lock:
            data = self._load()
            self._current = ConfigView(data)

    def update(self, data: Mapping[str, Any]) -> None:
        with self._lock:
            self._current = ConfigView(data)

    def _load(self) -> Dict[str, Any]:
        if not self._path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self._path}")
        content = self._path.read_text(encoding="utf-8")
        if not content.strip():
            return {}
        return json.loads(content)
