"""Smoke test that performs the "first light" demo for the Pi Cortex stack."""

from __future__ import annotations

import argparse
import os
import time

from mac_agent import AgentConfig, PiCortexAgent


def run_first_light(text: str, delay: float) -> None:
    config = AgentConfig.from_env(os.environ)
    agent = PiCortexAgent(config)
    agent.connect()
    try:
        agent.push_assets()
        time.sleep(delay)
        agent.publish_text(text)
    finally:
        agent.stop()


def main() -> None:
    parser = argparse.ArgumentParser(description="Pi Cortex first light smoke test")
    parser.add_argument("--text", default="HELLO", help="Text payload to publish")
    parser.add_argument(
        "--delay", type=float, default=1.0, help="Seconds to wait after pushing assets"
    )
    args = parser.parse_args()
    run_first_light(args.text, args.delay)


if __name__ == "__main__":
    main()
