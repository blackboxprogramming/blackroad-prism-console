import json
from pathlib import Path
from typing import Any

_catalogs = {}


def _load(lang: str) -> dict:
    if lang in _catalogs:
        return _catalogs[lang]
    path = Path(__file__).resolve().parent / f"{lang}.json"
    if not path.exists() and lang != "en":
        return _load("en")
    data = json.loads(path.read_text())
    _catalogs[lang] = data
    return data


def t(key: str, lang: str = "en", **kwargs: Any) -> str:
    catalog = _load(lang)
    if key not in catalog and lang != "en":
        catalog = _load("en")
    msg = catalog.get(key, key)
    return msg.format(**kwargs)
