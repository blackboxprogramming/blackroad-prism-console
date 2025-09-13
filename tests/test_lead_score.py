from marketing import lead_score
import json
from pathlib import Path


def test_lead_scores(tmp_path):
    scores = lead_score.score_leads("configs/marketing/lead_score.yaml")
    assert scores["C1"] == 15
    assert scores["C2"] == 0
    data = json.loads(Path("artifacts/marketing/lead_scores.json").read_text())
    assert data == scores
