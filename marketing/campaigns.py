import json
from dataclasses import dataclass
from pathlib import Path
from typing import List

from tools import artifacts, metrics, storage

from .segments import _load_contacts

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = ROOT / "artifacts/marketing/campaigns"


@dataclass
class Campaign:
    id: str
    channel: str
    audience_segment: str
    creatives: List[str]
    schedule: str
    guardrails: dict


class DutyError(Exception):
    code = "DUTY_CONSENT_MISSING"


def new_campaign(id: str, channel: str, segment: str, creatives: List[str], schedule: str = "now") -> Campaign:
    segs = json.loads(storage.read(str(ROOT / "artifacts/marketing/segments.json")))
    members = segs.get(segment, [])
    camp = Campaign(id=id, channel=channel, audience_segment=segment, creatives=creatives, schedule=schedule, guardrails={})
    plan = camp.__dict__ | {"audience_count": len(members)}
    artifacts.validate_and_write(str(ARTIFACTS_DIR / id / "plan.json"), plan)
    storage.write(str(ARTIFACTS_DIR / id / "plan.md"), f"# Campaign {id}\nchannel: {channel}\nsegment: {segment}\nmembers: {len(members)}")
    return camp


def validate_campaign(id: str) -> None:
    plan_path = ARTIFACTS_DIR / id / "plan.json"
    data = json.loads(storage.read(str(plan_path)))
    contacts = _load_contacts()
    missing = [cid for cid in json.loads(storage.read(str(ROOT / "artifacts/marketing/segments.json")))[data["audience_segment"]] if contacts.get(cid, {}).get("consent") != "true" and contacts.get(cid, {}).get("consent") is not True]
    if missing:
        raise DutyError(f"missing consent for {missing}")
    metrics.emit("campaign_validated")
