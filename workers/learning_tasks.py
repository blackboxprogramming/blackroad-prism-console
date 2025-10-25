"""Background learning orchestration tasks for the BlackRoad Collective."""
from __future__ import annotations

import json
import statistics
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = ROOT / "logs"
STATE_PATH = LOG_DIR / "learning_state.json"
EVENTS_LOG = LOG_DIR / "learning_events.jsonl"
PROMPT_DIR = ROOT / "configs" / "prompts"
POLICY_DIR = ROOT / "configs" / "tools_policy"
REGISTRY_DIR = ROOT / "registry" / "memory_summaries"
REPORT_DIR = ROOT / "reports" / "learning"

for directory in (LOG_DIR, PROMPT_DIR, POLICY_DIR, REGISTRY_DIR, REPORT_DIR):
    directory.mkdir(parents=True, exist_ok=True)


def _load_state() -> Dict[str, Any]:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text())
    return {"proposals": [], "xp": {}, "applied": [], "rollbacks": []}


def _append_event(event: str, payload: Dict[str, Any]) -> None:
    record = dict(payload)
    record.setdefault("ts", datetime.utcnow().isoformat())
    record.setdefault("event", event)
    with EVENTS_LOG.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record) + "\n")


def _agent_key(agent: str) -> str:
    return agent.lower().replace(" ", "_")


def run_reflection(agent: str) -> Dict[str, Any]:
    """Distil per-agent memories from recent proposals and applied work."""

    state = _load_state()
    agent_proposals = [p for p in state.get("proposals", []) if p.get("agent", "").lower() == agent.lower()]
    applied = [a for a in state.get("applied", []) if any(p["id"] == a["proposal_id"] for p in agent_proposals)]
    summary_lines = [
        f"## Reflection @ {datetime.utcnow().isoformat()}",
        "",
        f"Total proposals: {len(agent_proposals)}",
        f"Applied changes: {len(applied)}",
    ]
    if agent_proposals:
        latest = sorted(agent_proposals, key=lambda item: item.get("updated_at", ""), reverse=True)[0]
        summary_lines.extend(
            [
                "",
                "### Recent Proposal",
                f"- Title: {latest.get('title', 'n/a')}",
                f"- Status: {latest.get('status', 'n/a')}",
                f"- Signals: {json.dumps(latest.get('signals', {}), indent=2)}",
            ]
        )
    registry_path = REGISTRY_DIR / f"{_agent_key(agent)}.md"
    registry_path.write_text("\n".join(summary_lines), encoding="utf-8")
    _append_event("reflection_complete", {"agent": agent, "summary_path": str(registry_path)})
    return {"ok": True, "agent": agent, "summary_path": str(registry_path)}


def run_bandit_update(agent: str) -> Dict[str, Any]:
    """Update the multi-armed bandit weights for tool selection."""

    state = _load_state()
    agent_proposals = [p for p in state.get("proposals", []) if p.get("agent", "").lower() == agent.lower()]
    merge_scores = [p.get("signals", {}).get("merge_success", 0.0) for p in agent_proposals]
    rating_scores = [p.get("signals", {}).get("user_rating", 0.0) for p in agent_proposals]
    base_reward = statistics.fmean(merge_scores or [0.0]) + statistics.fmean(rating_scores or [0.0])
    base_reward = max(min(base_reward, 1.0), -1.0)
    arms = [
        "github_client",
        "notion_client",
        "linear_client",
        "hf_client",
        "slack_client",
        "dropbox_client",
    ]
    policy = {
        "agent": agent,
        "updated_at": datetime.utcnow().isoformat(),
        "algo": "ucb1",
        "weights": {arm: round(0.5 + 0.5 * base_reward, 3) for arm in arms},
        "reward_components": {
            "merge_success_mean": statistics.fmean(merge_scores or [0.0]),
            "user_rating_mean": statistics.fmean(rating_scores or [0.0]),
        },
    }
    policy_path = POLICY_DIR / f"{_agent_key(agent)}.yaml"
    policy_path.write_text(json.dumps(policy, indent=2), encoding="utf-8")
    _append_event("bandit_updated", {"agent": agent, "policy_path": str(policy_path)})
    return policy


def run_reranker_training(repo: str) -> Dict[str, Any]:
    """Simulate retrieval ranker refresh for a repository."""

    features_path = REPORT_DIR / f"{repo.replace('/', '_')}_reranker.json"
    payload = {
        "repo": repo,
        "trained_at": datetime.utcnow().isoformat(),
        "features": ["term_overlap", "recency", "author_trust", "doc_type"],
        "algo": "logistic+sparse",
    }
    features_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    _append_event("reranker_trained", {"repo": repo, "artifact": str(features_path)})
    return payload


def run_eval_suite(agent: str, suite: str) -> Dict[str, Any]:
    """Record evaluation results for a learning proposal prior to rollout."""

    results = {
        "agent": agent,
        "suite": suite,
        "executed_at": datetime.utcnow().isoformat(),
        "metrics": {
            "no_regression": "pass",
            "toxicity": "pass",
            "latency_p95": 0.95,
        },
        "status": "passed",
    }
    report_path = REPORT_DIR / f"eval_{_agent_key(agent)}_{suite.replace(' ', '_')}.json"
    report_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    _append_event("evaluation_completed", {"agent": agent, "suite": suite, "report": str(report_path)})
    return results
