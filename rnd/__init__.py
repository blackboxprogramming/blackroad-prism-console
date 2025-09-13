from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "rnd"
LAKE = ROOT / "artifacts" / "lake"
CONFIGS = ROOT / "configs" / "rnd"
NOTES_DIR = ROOT / "notes" / "rnd"
FIXTURES = ROOT / "fixtures" / "rnd" / "experiments"

ARTIFACTS.mkdir(parents=True, exist_ok=True)
LAKE.mkdir(parents=True, exist_ok=True)
CONFIGS.mkdir(parents=True, exist_ok=True)
NOTES_DIR.mkdir(parents=True, exist_ok=True)
