# Pure-local mapping from free text to ImageNet class_id using a JSON index file.
# Put torchvision's imagenet_class_index.json at the path in config.yaml.
import json
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
CFG = yaml.safe_load(open(HERE / "config.yaml"))

MAP_PATH = Path(CFG.get("label_map_json", ""))


def _load_map():
    if not MAP_PATH.exists():
        return {}
    j = json.loads(MAP_PATH.read_text())
    # j: {"0": ["n01440764", "tench"], "1": ["n01443537", "goldfish"], ...}
    data = {}
    for k, v in j.items():
        cid = int(k)
        wnid, name = v
        data[cid] = {"wnid": wnid, "name": name}
    return data


IDX = _load_map()


def lookup_class_id(text: str):
    if not IDX:
        return None
    q = text.strip().lower()
    # exact match on name
    for cid, rec in IDX.items():
        if q == rec["name"].lower():
            return cid
    # substring match
    best = None
    for cid, rec in IDX.items():
        if q in rec["name"].lower():
            best = cid
            break
    return best
