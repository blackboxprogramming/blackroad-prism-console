"""Entry point for executing a Genesis scene generation run."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict

import yaml


def load_prompt(prompt_path: Path) -> str:
    return prompt_path.read_text(encoding="utf-8").strip()


def load_config(config_path: Path) -> Dict[str, Any]:
    with config_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Genesis scene generation.")
    parser.add_argument("--prompt", type=Path, default=Path(__file__).with_name("prompt.txt"), help="Path to the prompt file.")
    parser.add_argument("--config", type=Path, default=Path(__file__).with_name("config.yaml"), help="Path to the YAML config.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent.parent / "artifacts" / "genesis",
        help="Directory to store Genesis outputs.",
    )
    args = parser.parse_args()

    prompt = load_prompt(args.prompt)
    config = load_config(args.config)

    args.output.mkdir(parents=True, exist_ok=True)

    # TODO: Replace the stub below with an actual Genesis API invocation.
    # For example:
    #   from genesis import Client
    #   client = Client.from_env()
    #   result = client.generate_scene(prompt=prompt, **config)
    #   result.save(args.output)
    run_metadata: Dict[str, Any] = {
        "prompt": prompt,
        "config": config,
        "status": "stubbed",
    }

    run_meta_path = args.output / "run_meta.json"
    with run_meta_path.open("w", encoding="utf-8") as handle:
        json.dump(run_metadata, handle, indent=2)

    print(f"Genesis stub completed. Metadata written to {run_meta_path}")


if __name__ == "__main__":
    main()
