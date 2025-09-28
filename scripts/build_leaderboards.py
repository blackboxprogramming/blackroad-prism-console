#!/usr/bin/env python3
"""Generate mining leaderboards and trophy snapshots.

This script reads mining block data from ``logs/blocks.csv`` and produces a
Markdown leaderboard alongside a JSON snapshot that other systems can consume.
Only the Python standard library is required so that the script runs in minimal
environments (for example, CI pipelines or bare ``python3`` installs).

The behaviour is configured through ``config/leaderboard_config.json``.  The
config file can safely omit keys because defaults are merged in by this script.

Example usage::

    python3 scripts/build_leaderboards.py

"""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG_PATH = ROOT / "config" / "leaderboard_config.json"
DEFAULT_BLOCKS_PATH = ROOT / "logs" / "blocks.csv"
DEFAULT_MARKDOWN_PATH = ROOT / "leaderboard.md"
DEFAULT_JSON_PATH = ROOT / "leaderboard_snapshot.json"

DEFAULT_CONFIG = {
    "energy_target_kwh": 42.0,
    "coolest_block_mode": "highest_fees",
    "trophies": {
        "coolest_block": "🏆 Coolest Block",
        "energy_saver": "🟢 Energy Saver",
        "fee_hunter": "🔥 Fee Hunter",
    },
    "output": {
        "markdown_path": str(DEFAULT_MARKDOWN_PATH.relative_to(ROOT)),
        "json_path": str(DEFAULT_JSON_PATH.relative_to(ROOT)),
    },
}

SUPPORTED_COOLEST_MODES = {"highest_fees", "lowest_energy"}


def load_config(path: Path) -> Dict[str, object]:
    """Load the leaderboard config, merging with defaults."""

    config = json.loads(json.dumps(DEFAULT_CONFIG))  # deep copy via JSON
    if path.exists():
        with path.open("r", encoding="utf-8") as handle:
            user_config = json.load(handle)
        config = _deep_update(config, user_config)
    return config


def _deep_update(base: Dict[str, object], override: Dict[str, object]) -> Dict[str, object]:
    """Recursively merge ``override`` into ``base``."""

    for key, value in override.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            base[key] = _deep_update(base[key], value)  # type: ignore[arg-type]
        else:
            base[key] = value
    return base


def parse_blocks(csv_path: Path) -> List[Dict[str, str]]:
    """Load block rows from the CSV file.

    The CSV must include headers: ``timestamp``, ``block_id``, ``miner``,
    ``energy_kwh`` and ``fees_usd``. Additional columns are ignored but preserved
    for future compatibility.
    """

    if not csv_path.exists():
        return []

    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = [row for row in reader if any(value.strip() for value in row.values() if value)]
    return rows


def _to_float(value: str, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def compute_stats(
    rows: Iterable[Dict[str, str]],
    *,
    energy_target: float,
    coolest_mode: str,
) -> Tuple[Dict[str, object], Dict[str, object]]:
    """Compute leaderboard statistics.

    Returns
    -------
    Tuple[dict, dict]
        A pair ``(leaderboard, highlights)``.
    """

    miner_stats: Dict[str, Dict[str, float]] = defaultdict(lambda: {
        "blocks": 0,
        "total_fees": 0.0,
        "total_energy": 0.0,
        "green_wins": 0,
    })

    coolest_block = None
    energy_best = None
    fee_best = None

    for row in rows:
        miner = (row.get("miner") or "").strip() or "Unknown"
        energy = _to_float(row.get("energy_kwh", "0"))
        fees = _to_float(row.get("fees_usd", "0"))

        stats = miner_stats[miner]
        stats["blocks"] += 1
        stats["total_fees"] += fees
        stats["total_energy"] += energy
        if energy <= energy_target:
            stats["green_wins"] += 1

        block_info = {
            "miner": miner,
            "block_id": row.get("block_id", ""),
            "energy_kwh": energy,
            "fees_usd": fees,
            "timestamp": row.get("timestamp", ""),
        }

        if coolest_mode == "highest_fees":
            key = fees
            better = coolest_block is None or key > coolest_block["fees_usd"]
        else:  # lowest_energy
            key = energy if energy > 0 else float("inf")
            better = coolest_block is None or key < (coolest_block.get("energy_kwh") or float("inf"))
        if better:
            coolest_block = block_info

        if energy_best is None or stats["green_wins"] > energy_best[1]:
            energy_best = (miner, stats["green_wins"])

        if fee_best is None or stats["total_fees"] > fee_best[1]:
            fee_best = (miner, stats["total_fees"])

    leaderboard = {
        miner: {
            **stats,
            "average_energy": (stats["total_energy"] / stats["blocks"]) if stats["blocks"] else 0.0,
        }
        for miner, stats in miner_stats.items()
    }

    highlights = {
        "coolest_block": coolest_block,
        "energy_saver": energy_best[0] if energy_best else None,
        "fee_hunter": fee_best[0] if fee_best else None,
    }
    return leaderboard, highlights


def render_markdown(
    *,
    leaderboard: Dict[str, Dict[str, float]],
    highlights: Dict[str, object],
    trophies: Dict[str, str],
    energy_target: float,
) -> str:
    """Create the leaderboard Markdown representation."""

    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S %Z")
    if not leaderboard:
        return (
            f"# Mining Leaderboard\n\n"
            f"_Generated {generated}_\n\n"
            "No blocks logged yet. Add entries to `logs/blocks.csv` and rerun the script.\n"
        )

    trophy_lookup = {
        "energy_saver": trophies.get("energy_saver", "Energy Saver"),
        "fee_hunter": trophies.get("fee_hunter", "Fee Hunter"),
    }

    lines = ["# Mining Leaderboard", "", f"_Generated {generated}_", ""]
    lines.append(f"Green wins count blocks with ≤ {energy_target:.2f} kWh.")
    lines.append("")
    lines.append("| Miner | Blocks | Green Wins | Total Fees (USD) | Avg Energy (kWh) | Trophies |")
    lines.append("| --- | ---: | ---: | ---: | ---: | --- |")

    def sort_key(item: Tuple[str, Dict[str, float]]) -> Tuple[float, float, str]:
        miner, stats = item
        return (-stats["blocks"], -stats["total_fees"], miner.lower())

    for miner, stats in sorted(leaderboard.items(), key=sort_key):
        trophies_awarded: List[str] = []
        if highlights.get("energy_saver") == miner and trophy_lookup["energy_saver"]:
            trophies_awarded.append(trophy_lookup["energy_saver"])
        if highlights.get("fee_hunter") == miner and trophy_lookup["fee_hunter"]:
            trophies_awarded.append(trophy_lookup["fee_hunter"])

        lines.append(
            "| {miner} | {blocks} | {green} | {fees:.2f} | {avg:.2f} | {trophies} |".format(
                miner=miner,
                blocks=int(stats["blocks"]),
                green=int(stats["green_wins"]),
                fees=stats["total_fees"],
                avg=stats["average_energy"],
                trophies=", ".join(trophies_awarded) or "",
            )
        )

    lines.append("")

    coolest = highlights.get("coolest_block")
    if isinstance(coolest, dict):
        label = trophies.get("coolest_block", "Coolest Block")
        descriptor = (
            f"Block {coolest.get('block_id', 'unknown')} by {coolest.get('miner', 'unknown')} "
            f"- {coolest.get('fees_usd', 0.0):.2f} USD fees, {coolest.get('energy_kwh', 0.0):.2f} kWh"
        )
        lines.append(f"{label}: {descriptor}.")
        lines.append("")

    lines.append("Stay green and keep the blocks coming! 🌱")
    lines.append("")
    return "\n".join(lines)


def write_outputs(
    *,
    markdown_content: str,
    json_data: Dict[str, object],
    markdown_path: Path,
    json_path: Path,
) -> None:
    markdown_path.write_text(markdown_content, encoding="utf-8")
    json_path.write_text(json.dumps(json_data, indent=2, sort_keys=True), encoding="utf-8")


def build_leaderboards(
    *,
    config_path: Path = DEFAULT_CONFIG_PATH,
    blocks_path: Path = DEFAULT_BLOCKS_PATH,
) -> None:
    config = load_config(config_path)
    trophies = config.get("trophies", {}) if isinstance(config.get("trophies"), dict) else {}
    coolest_mode = str(config.get("coolest_block_mode", "highest_fees"))
    if coolest_mode not in SUPPORTED_COOLEST_MODES:
        raise ValueError(
            f"Unsupported coolest_block_mode '{coolest_mode}'. Supported modes: {sorted(SUPPORTED_COOLEST_MODES)}"
        )

    energy_target = float(config.get("energy_target_kwh", DEFAULT_CONFIG["energy_target_kwh"]))
    output_config = config.get("output", {}) if isinstance(config.get("output"), dict) else {}

    markdown_path = (ROOT / output_config.get("markdown_path", DEFAULT_CONFIG["output"]["markdown_path"]))
    json_path = (ROOT / output_config.get("json_path", DEFAULT_CONFIG["output"]["json_path"]))

    rows = parse_blocks(blocks_path)
    leaderboard, highlights = compute_stats(
        rows,
        energy_target=energy_target,
        coolest_mode=coolest_mode,
    )
    generated_at = datetime.now(timezone.utc).isoformat()
    markdown_content = render_markdown(
        leaderboard=leaderboard,
        highlights=highlights,
        trophies=trophies,
        energy_target=energy_target,
    )
    json_payload = {
        "generated_at": generated_at,
        "energy_target_kwh": energy_target,
        "coolest_block_mode": coolest_mode,
        "trophies": trophies,
        "leaderboard": leaderboard,
        "highlights": highlights,
    }
    write_outputs(
        markdown_content=markdown_content,
        json_data=json_payload,
        markdown_path=markdown_path,
        json_path=json_path,
    )


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build mining leaderboards from block logs.")
    parser.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG_PATH,
        help="Path to leaderboard_config.json (defaults to config/leaderboard_config.json).",
    )
    parser.add_argument(
        "--blocks",
        type=Path,
        default=DEFAULT_BLOCKS_PATH,
        help="Path to blocks.csv (defaults to logs/blocks.csv).",
    )
    return parser.parse_args(argv)


def main(argv: Iterable[str] | None = None) -> None:
    args = parse_args(argv)
    build_leaderboards(config_path=args.config, blocks_path=args.blocks)


if __name__ == "__main__":
    main()
