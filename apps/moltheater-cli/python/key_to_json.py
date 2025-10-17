"""Convert compact coding-key markup into conductor JSON."""
from __future__ import annotations

import json
import re
import sys
from typing import Any, Dict, List

TOKEN_PATTERN = re.compile(r"\[([^\|\]]+)(?:\|([^\]]+))?\]")


def parse_key(source: str) -> List[Dict[str, Any]]:
  """Parse coding-key markup into word payloads."""
  entries: List[Dict[str, Any]] = []
  for word, field_blob in TOKEN_PATTERN.findall(source):
    pace = 1.0
    emph = 0.0
    pitch = 0
    overlay = None
    gesture = None
    beat = None

    if field_blob:
      for raw_field in filter(None, field_blob.split("|")):
        if "*" in raw_field:
          overlay = "harm"
        if "!" in raw_field:
          gesture = "microZoom"

        token = raw_field
        if "@" in token:
          token, beat = token.split("@", 1)

        normalized = token.replace("*", "").replace("!", "")
        if re.fullmatch(r"p-?\d+(?:\.\d+)?", normalized):
          pace = float(normalized[1:])
          continue
        if re.fullmatch(r"e-?\d+(?:\.\d+)?", normalized):
          emph = float(normalized[1:])
          continue
        if re.fullmatch(r"p[+-]\d+", normalized):
          pitch = int(normalized[1:])
          continue

    entries.append(
      {
        "t": word,
        "pace": pace,
        "emph": emph,
        "pitch": pitch,
        "overlay": overlay,
        "gesture": gesture,
        "beat": beat,
      }
    )
  return entries


def clamp(sequence: List[Dict[str, Any]], pace=(0.75, 1.25), pitch=(-5, 5), budget=0.35) -> List[Dict[str, Any]]:
  """Clamp pacing, emphasis, and pitch to safe ranges."""
  for word in sequence:
    word["pace"] = max(pace[0], min(pace[1], float(word.get("pace", 1.0))))
    word["pitch"] = max(pitch[0], min(pitch[1], int(word.get("pitch", 0))))
    word["emph"] = max(0.0, min(1.0, float(word.get("emph", 0.0))))

  total = sum(word["emph"] for word in sequence) or 1.0
  if total > budget:
    scale = budget / total
    for word in sequence:
      word["emph"] = round(word["emph"] * scale, 4)
  return sequence


def main() -> None:
  source = sys.stdin.read()
  seq = clamp(parse_key(source))
  payload = {
    "bpm": 120,
    "time": "4/4",
    "quant": "1/16",
    "seq": seq,
    "post": [],
  }
  json.dump(payload, sys.stdout, indent=2)
  sys.stdout.write("\n")


if __name__ == "__main__":
  main()
