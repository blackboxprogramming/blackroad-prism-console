"""Smoke test that performs the "first light" demo for the Pi Cortex stack."""

from __future__ import annotations

import argparse
import logging
import os
import time
from typing import Optional

from mac_agent import AgentConfig, PiCortexAgent

logger = logging.getLogger(__name__)


def run_first_light(text: str, delay: float, audio_name: Optional[str], skip_audio: bool) -> None:
    config = AgentConfig.from_env(os.environ)
    agent = PiCortexAgent(config)
    agent.connect()
    try:
        agent.push_assets()
        if not skip_audio:
            clip_name = audio_name or config.audio_asset
            if clip_name:
                try:
                    agent.push_audio(audio_name=clip_name)
                except FileNotFoundError:
                    logger.warning("Audio clip %s not found; skipping audio push", clip_name)
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
    parser.add_argument(
        "--audio",
        default=None,
        help=(
            "Audio asset file name inside the assets directory. Provide 'none' to skip pushing "
            "audio. Defaults to PI_CORTEX_AUDIO_ASSET."
        ),
    )
    args = parser.parse_args()
    audio_name: Optional[str] = None
    skip_audio = False
    if args.audio is not None:
        if args.audio.lower() == "none":
            skip_audio = True
        else:
            audio_name = args.audio
    run_first_light(args.text, args.delay, audio_name, skip_audio)


if __name__ == "__main__":
    main()
