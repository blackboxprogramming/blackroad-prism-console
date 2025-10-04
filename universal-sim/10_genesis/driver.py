"""Utility harness for running Genesis-style generative simulations.

This script handles configuration loading, light-weight overrides, run folder
creation, and metadata capture. Plug in your engine by either:

1. Populating `engine.command` in the YAML config with a CLI invocation that accepts a
   `--config <path>` argument, **or**
2. Implementing `execute_engine(config: dict, output_dir: Path)` below to call a Python
   SDK directly.

Example usage:

```
python driver.py --config config.baseline.yaml --label baseline
python driver.py --config config.baseline.yaml --label mu_001 --override fluid.viscosity=0.010
python driver.py --archive runs/20240229_120102_baseline
```
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, Iterable, Tuple

try:
    import yaml
except ImportError as exc:  # pragma: no cover - import guidance
    raise SystemExit("PyYAML is required. Install with `pip install pyyaml`." ) from exc

RUN_ROOT = Path(__file__).resolve().parent
RUNS_DIR = RUN_ROOT / "runs"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Genesis simulation driver")
    parser.add_argument("--config", type=Path, help="Path to YAML configuration.")
    parser.add_argument("--label", type=str, help="Run label (e.g., baseline, dry_run).", nargs="?")
    parser.add_argument("--duration", type=float, help="Override simulation duration (seconds).", default=None)
    parser.add_argument("--override", action="append", default=[],
                        help="Override in dotted.path=value form (YAML-parsed value). Can repeat.")
    parser.add_argument("--archive", type=Path, help="Archive an existing run folder instead of executing.")
    parser.add_argument("--prompt", type=Path, default=RUN_ROOT / "prompt.txt",
                        help="Optional prompt file to copy into the run directory.")
    parser.add_argument("--engine-entry", type=str, default=None,
                        help="Python module path to call as engine executor (function name optional).")
    parser.add_argument("--dry", action="store_true", help="Skip engine execution; useful for setup validation.")
    return parser.parse_args()


def archive_run(run_dir: Path) -> None:
    if not run_dir.exists():
        raise SystemExit(f"Run directory {run_dir} does not exist.")
    archive_path = run_dir.with_suffix(".tar.zst")
    if archive_path.exists():
        raise SystemExit(f"Archive already exists: {archive_path}")
    print(f"Archiving {run_dir} -> {archive_path}")
    shutil.make_archive(run_dir.as_posix(), "gztar", root_dir=run_dir.parent, base_dir=run_dir.name)
    # Rename .tar.gz to .tar.zst-like extension for clarity? use gz? For now keep .tar.gz
    gz_path = run_dir.with_suffix(".tar.gz")
    archive_path = gz_path
    sha_path = archive_path.with_suffix(".sha256")
    digest = compute_sha256(archive_path)
    sha_path.write_text(f"{digest}  {archive_path.name}\n", encoding="utf-8")
    print(f"Archive created: {archive_path} (sha256 -> {sha_path})")


def compute_sha256(path: Path) -> str:
    import hashlib

    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_config(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def apply_overrides(config: Dict[str, Any], overrides: Iterable[str]) -> Dict[str, Any]:
    for override in overrides:
        if "=" not in override:
            raise SystemExit(f"Invalid override '{override}'. Use dotted.path=value format.")
        key, value_raw = override.split("=", 1)
        keys = key.split(".")
        try:
            value = yaml.safe_load(value_raw)
        except yaml.YAMLError as exc:
            raise SystemExit(f"Failed to parse override value '{value_raw}': {exc}") from exc
        target = config
        for subkey in keys[:-1]:
            if subkey not in target or not isinstance(target[subkey], dict):
                target[subkey] = {}
            target = target[subkey]
        target[keys[-1]] = value
        print(f"Override applied: {key} = {value}")
    return config


def ensure_runs_dir() -> None:
    RUNS_DIR.mkdir(exist_ok=True)


def prepare_run_folder(label: str | None) -> Tuple[Path, str]:
    timestamp = dt.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    label_part = f"_{label}" if label else ""
    run_id = f"{timestamp}{label_part}"
    run_dir = RUNS_DIR / run_id
    run_dir.mkdir(parents=True, exist_ok=False)
    (run_dir / "fields").mkdir()
    (run_dir / "meshes").mkdir()
    (run_dir / "diagnostics").mkdir()
    (run_dir / "media").mkdir()
    return run_dir, run_id


def write_prompt(prompt_path: Path, run_dir: Path) -> None:
    if not prompt_path.exists():
        print(f"Prompt file {prompt_path} not found; skipping copy.")
        return
    shutil.copy2(prompt_path, run_dir / "prompt.txt")


def execute_engine(config: Dict[str, Any], run_dir: Path, engine_entry: str | None) -> subprocess.CompletedProcess | None:
    """Execute the configured engine.

    If `engine_entry` or `config['engine'].get('command')` is provided, the command is run
    via subprocess. Otherwise, this function looks for a Python callable to execute.
    Customize as needed for your environment.
    """
    engine_cfg = config.get("engine", {})
    if engine_entry:
        return call_python_entry(engine_entry, config, run_dir)

    command = engine_cfg.get("command")
    if command:
        return call_command(command, config, run_dir)

    # Placeholder: adapt this block to your SDK (e.g., genesis.run_scene(...)).
    print("No engine command or entrypoint provided. Skipping execution.\n"
          "Implement `execute_engine` or supply --engine-entry/engine.command.")
    return None


def call_command(command: str, config: Dict[str, Any], run_dir: Path) -> subprocess.CompletedProcess:
    with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False) as tmp:
        yaml.safe_dump(config, tmp)
        temp_path = Path(tmp.name)
    cmd = command.split()
    cmd += ["--config", str(temp_path), "--output", str(run_dir)]
    print(f"Running command: {' '.join(cmd)}")
    start = time.perf_counter()
    try:
        result = subprocess.run(cmd, check=False, capture_output=True, text=True)
    finally:
        temp_path.unlink(missing_ok=True)
    duration = time.perf_counter() - start
    (run_dir / "diagnostics" / "engine_stdout.log").write_text(result.stdout, encoding="utf-8")
    (run_dir / "diagnostics" / "engine_stderr.log").write_text(result.stderr, encoding="utf-8")
    print(f"Engine finished in {duration:.2f}s with return code {result.returncode}")
    return result


def call_python_entry(entry: str, config: Dict[str, Any], run_dir: Path) -> subprocess.CompletedProcess | None:
    module_name, _, func_name = entry.partition(":")
    module = __import__(module_name, fromlist=[func_name] if func_name else [])
    if func_name:
        func = getattr(module, func_name)
    else:
        func = getattr(module, "main")
    print(f"Executing {module_name}.{func.__name__}()")
    start = time.perf_counter()
    func(config=config, output_dir=run_dir)
    duration = time.perf_counter() - start
    print(f"Engine callable completed in {duration:.2f}s")
    # mimic CompletedProcess API
    return subprocess.CompletedProcess(args=[entry], returncode=0, stdout="", stderr="")


def gather_system_info() -> Dict[str, Any]:
    info: Dict[str, Any] = {
        "python": sys.version,
        "platform": sys.platform,
        "env": {k: v for k, v in os.environ.items() if k.startswith("GENESIS_")},
    }
    try:
        import torch

        if torch.cuda.is_available():
            info["gpu"] = {
                "count": torch.cuda.device_count(),
                "devices": [torch.cuda.get_device_name(i) for i in range(torch.cuda.device_count())],
            }
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            info["gpu"] = {"mps": True}
    except Exception:
        info.setdefault("gpu", "unavailable")
    return info


def main() -> None:
    args = parse_args()

    if args.archive:
        archive_run(args.archive)
        return

    if not args.config:
        raise SystemExit("--config is required when not archiving.")

    ensure_runs_dir()

    config = load_config(args.config)
    if args.duration is not None:
        config["sim_duration"] = args.duration
    config = apply_overrides(config, args.override)

    run_dir, run_id = prepare_run_folder(args.label)

    yaml.safe_dump(config, (run_dir / "config.yaml").open("w", encoding="utf-8"))
    write_prompt(args.prompt, run_dir)

    metadata: Dict[str, Any] = {
        "run_id": run_id,
        "label": args.label,
        "start_time_utc": dt.datetime.utcnow().isoformat() + "Z",
        "config_source": str(args.config),
        "overrides": args.override,
        "system_info": gather_system_info(),
    }

    if args.dry:
        metadata["status"] = "dry-run"
        (run_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        print(f"Dry run complete: metadata stored at {run_dir / 'metadata.json'}")
        return

    start_time = time.perf_counter()
    result = execute_engine(config, run_dir, args.engine_entry)
    duration = time.perf_counter() - start_time

    metadata.update(
        {
            "end_time_utc": dt.datetime.utcnow().isoformat() + "Z",
            "duration_seconds": duration,
            "engine_result": None if result is None else {
                "returncode": result.returncode,
                "stdout_path": str(run_dir / "diagnostics" / "engine_stdout.log"),
                "stderr_path": str(run_dir / "diagnostics" / "engine_stderr.log"),
            },
        }
    )

    (run_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Metadata written to {run_dir / 'metadata.json'}")


if __name__ == "__main__":
    main()
