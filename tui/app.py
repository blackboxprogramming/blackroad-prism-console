import json
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parents[1]
THEME_DIR = ROOT / "themes"

KEYBIND_MAP = {"up": "k", "down": "j", "accept": "enter"}


def load_theme(name: str) -> Dict:
    path = THEME_DIR / f"{name}.json"
    return json.loads(path.read_text())


def run(theme: str = "default", lang: str = "en") -> Dict:
    theme_data = load_theme(theme)
    return {"theme": theme_data, "lang": lang, "keybinds": KEYBIND_MAP}

