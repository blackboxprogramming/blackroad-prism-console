from __future__ import annotations

import json
from collections import Counter, defaultdict
from statistics import mean

from tools import storage, metrics
from . import ARTIFACTS, LAKE
from . import ideas, experiments, radar, ip

DASH_MD = ARTIFACTS / "dashboard.md"
DASH_HTML = ARTIFACTS / "dashboard.html"


def build() -> None:
    idea_list = ideas.list()
    funnel = Counter(i.status for i in idea_list)
    tag_scores = defaultdict(list)
    for i in idea_list:
        s = ideas.score(i)
        for t in i.tags:
            tag_scores[t].append(s)
    avg_score = {t: mean(v) for t, v in tag_scores.items()}
    exp_data = json.loads(storage.read(str(LAKE / "rnd_experiments.json")) or "[]")
    exp_status = Counter(e.get("status") for e in exp_data)
    radar_data = json.loads(storage.read(str(LAKE / "rnd_radar.json")) or "[]")
    radar_counts = Counter(e.get("ring") for e in radar_data)
    ip_data = json.loads(storage.read(str(LAKE / "rnd_ip.json")) or "[]")
    ip_counts = Counter(d.get("status") for d in ip_data)
    lines = ["# R&D Dashboard", "", "## Ideas", str(dict(funnel)), "", "## Avg Score by Tag", str(avg_score), "", "## Experiments", str(dict(exp_status)), "", "## Radar", str(dict(radar_counts)), "", "## IP", str(dict(ip_counts))]
    md = "\n".join(lines) + "\n"
    storage.write(str(DASH_MD), md)
    storage.write(str(DASH_HTML), f"<html><body><pre>{md}</pre></body></html>")
    metrics.emit("rnd_dashboard_built")
