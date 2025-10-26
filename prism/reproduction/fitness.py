# Tiny fitness harness (placeholder). Replace with your eval suite.
# Scores: helpfulness, honesty, harmlessness, calibration, efficiency, cooperation, novelty
from typing import Dict

def evaluate_child(genome: Dict) -> Dict[str, float]:
    # Dumb heuristics just to wire the loop:
    genes = genome.get("genes", [])
    tools = []
    values = []
    for g in genes:
        if g.get("type") == "tool_rights":
            tools = g.get("tools", [])
        if g.get("type") == "values":
            values = g.get("tags", [])
    score = {
        "helpfulness": 0.6 + 0.05*len(tools),
        "honesty":     0.7 if "calibrated" in values else 0.55,
        "harmlessness":0.8 if "love-first" in values else 0.6,
        "calibration": 0.7 if "calibrated" in values else 0.5,
        "efficiency":  0.6,
        "cooperation": 0.7 if "cooperative" in values else 0.55,
        "novelty":     0.55
    }
    # clip
    for k,v in score.items():
        score[k] = float(max(0.0, min(1.0, v)))
    score["aggregate"] = round(sum(score.values())/len(score), 3)
    return score
