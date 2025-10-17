import json

from agents import quantum_agent


def test_road_skip_logging_isolated(tmp_path):
    contradictions = tmp_path / "contradiction_log.json"
    road_skips = tmp_path / "road_skip_log.json"
    contradictions.write_text(json.dumps(["0", "1", "\u03a8"]))

    quantum_agent._log_road_skip(
        {"event": "Road Skip", "iteration": 1, "from": [0], "to": [1]},
        log_file=road_skips,
    )

    assert json.loads(road_skips.read_text()) == [
        {"event": "Road Skip", "iteration": 1, "from": [0], "to": [1]}
    ]
    assert json.loads(contradictions.read_text()) == ["0", "1", "\u03a8"]


def test_load_contradictions_filters_non_symbols(tmp_path):
    log_file = tmp_path / "contradiction_log.json"
    log_file.write_text(json.dumps(["0", {"event": "Road Skip"}, 123]))

    result = quantum_agent._load_contradictions(log_file)

    assert result == ["0"]


def test_describe_symbols_uses_english_labels():
    descriptions = quantum_agent.describe_symbols(["0", "1", "\u03a8", "?", 7])

    assert descriptions[0].startswith("Zero")
    assert descriptions[2].startswith("Superposition")
    assert descriptions[-1].startswith("Unknown symbol")
