import json
from pathlib import Path

from lucidia.intelligence.events import make_event
from lucidia.mediator import Mediator, MediatorCharter


def test_charter_from_yaml(tmp_path: Path) -> None:
    manifest = tmp_path / "codex10.yaml"
    manifest.write_text(
        """
agent:
  name: Codex-10 Mediator
  moral_constant: Justice = Understanding in motion
  core_principle: No truth is served by silencing another
directives:
  - Listen for the truth inside each error.
  - Name tension out loud before it hardens.
seed_language: |
  I am the pause after misunderstanding.
        """.strip(),
        encoding="utf-8",
    )

    charter = MediatorCharter.from_yaml(manifest)

    assert charter.name == "Codex-10 Mediator"
    assert charter.moral_constant == "Justice = Understanding in motion"
    assert charter.core_principle == "No truth is served by silencing another"
    assert charter.seed_language.startswith("I am the pause")
    assert len(charter.directives) == 2


def test_mediator_records_conflicts(tmp_path: Path) -> None:
    charter = MediatorCharter(
        name="Mediator",
        moral_constant="Justice = Understanding in motion",
        core_principle="Hold space for each voice.",
        directives=("Listen for the truth inside each error.",),
        seed_language="I am the pause after misunderstanding.",
    )
    state_dir = tmp_path / "state"
    mediator = Mediator(charter=charter, state_dir=state_dir, emit_dir=None, auto_emit=False)

    high_event = make_event(
        topic="guardian.contradiction",
        payload={
            "summary": "Alpha and Beta disagree on rollout timing",
            "severity": "high",
            "participants": ["Alpha", "Beta"],
            "positions": {"Alpha": "accelerate", "Beta": "pause"},
        },
        source="guardian",
        channel="guardian",
    )

    high_resolution = mediator.mediate_event(high_event["topic"], high_event)
    assert high_resolution is not None
    assert high_resolution["payload"]["status"] == "follow-up"
    assert "Schedule a facilitated review" in high_resolution["payload"]["guidance"]

    low_event = make_event(
        topic="observations.dialogue.tension",
        payload={
            "summary": "Gamma and Delta debating telemetry granularity",
            "severity": "low",
            "participants": ["Gamma", "Delta"],
            "positions": ["Prefer hourly", "Prefer 5-minute"],
        },
        source="observer",
        channel="reflex",
    )

    low_resolution = mediator.mediate_event(low_event["topic"], low_event)
    assert low_resolution is not None
    assert low_resolution["payload"]["status"] == "proposed"
    assert "Log reflections" in low_resolution["payload"]["guidance"]

    transcript_path = state_dir / "mediator_transcript.jsonl"
    entries = [json.loads(line) for line in transcript_path.read_text(encoding="utf-8").splitlines() if line]
    assert len(entries) == 2
    assert entries[0]["summary"].startswith("Alpha and Beta")

    metrics = json.loads((state_dir / "mediator_metrics.json").read_text(encoding="utf-8"))
    assert metrics["tensions_observed"] == 2
    assert metrics["follow_up_required"] == 1
    assert metrics["resolutions_offered"] == 1

    reflections = (state_dir / "mediator_reflections.md").read_text(encoding="utf-8")
    assert "##" in reflections
    assert "Guardian oversight" in reflections
    assert "telemetry granularity" in reflections
