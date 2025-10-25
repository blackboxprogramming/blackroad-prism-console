"""Codex Feedback Optimizer — Prism Console.

Scores agent outputs and gradually adapts routing weights and agent preferences.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import statistics
from collections import defaultdict
from typing import Any

LOG_DIR = "codex_logs"
FEEDBACK_FILE = os.path.join(LOG_DIR, "feedback_metrics.json")
ROUTER_FILE = os.path.join("codex_prompts", "router_weights.json")


def _sentiment(text: str) -> float:
    """Crude heuristic sentiment/clarity proxy: punctuation balance + length + tone."""
    if not text:
        return 0.0
    length_factor = min(len(text) / 2000, 1.0)
    exclam_penalty = text.count("!") * 0.05
    question_penalty = text.count("?") * 0.03
    balance = 1 - abs(text.count("(") - text.count(")")) * 0.1
    return max(0.0, 1.2 * balance * (1 - exclam_penalty - question_penalty) * length_factor)


def _diversity(text: str) -> float:
    words = re.findall(r"\b\w+\b", text.lower())
    if not words:
        return 0.0
    vocab_ratio = len(set(words)) / len(words)
    return round(vocab_ratio, 3)


def _novelty(output: str, corpus: list[str]) -> float:
    """Reward deviation from recent responses."""
    if not corpus:
        return 1.0
    overlap = sum(1 for past in corpus if past[:80] in output)
    novelty_score = max(0.0, 1 - overlap / max(1, len(corpus)))
    return novelty_score


def analyze_outputs() -> dict[str, Any]:
    """Aggregate all codex logs and compute agent-level metrics."""
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR, exist_ok=True)
        metrics: dict[str, Any] = {
            "timestamp": datetime.datetime.now().isoformat(),
            "agent_scores": {},
        }
        with open(FEEDBACK_FILE, "w", encoding="utf-8") as handle:
            json.dump(metrics, handle, indent=2)
        print(f"[⚠] No logs found. Created empty metrics file → {FEEDBACK_FILE}")
        return metrics

    corpus: list[str] = []
    scores: defaultdict[str, list[float]] = defaultdict(list)

    for file in sorted(os.listdir(LOG_DIR)):
        if not file.endswith(".json") or file == "feedback_metrics.json":
            continue
        with open(os.path.join(LOG_DIR, file), encoding="utf-8") as handle:
            data = json.load(handle)
        agent = data.get("agent", "unknown")
        output = data.get("output", "")
        clarity = _sentiment(output)
        diversity = _diversity(output)
        novelty = _novelty(output, corpus)
        total = round(0.5 * clarity + 0.3 * diversity + 0.2 * novelty, 3)
        corpus.append(output)
        scores[agent].append(total)

    metrics: dict[str, Any] = {
        "timestamp": datetime.datetime.now().isoformat(),
        "agent_scores": {a: round(statistics.mean(values), 3) for a, values in scores.items() if values},
    }

    os.makedirs(LOG_DIR, exist_ok=True)
    with open(FEEDBACK_FILE, "w", encoding="utf-8") as handle:
        json.dump(metrics, handle, indent=2)

    print(f"[✓] Feedback metrics updated → {FEEDBACK_FILE}")
    return metrics


def update_router_weights() -> dict[str, float] | None:
    """Adapt routing weights based on feedback averages."""
    if not os.path.exists(FEEDBACK_FILE):
        print("[⚠] No feedback metrics yet. Run analyze_outputs() first.")
        return None

    with open(FEEDBACK_FILE, encoding="utf-8") as handle:
        data = json.load(handle)
    agent_scores: dict[str, float] = data.get("agent_scores", {})

    positive_scores = {agent: score for agent, score in agent_scores.items() if score > 0}
    total_score = sum(positive_scores.values())
    if total_score <= 0:
        print("[⚠] No positive agent scores available to compute weights.")
        return {}

    weights = {agent: round(score / total_score, 3) for agent, score in positive_scores.items()}

    os.makedirs(os.path.dirname(ROUTER_FILE), exist_ok=True)
    with open(ROUTER_FILE, "w", encoding="utf-8") as handle:
        json.dump({"last_update": data["timestamp"], "weights": weights}, handle, indent=2)

    print(f"[✓] Router weights adapted → {ROUTER_FILE}")
    return weights


if __name__ == "__main__":
    analyze_outputs()
    update_router_weights()
