import json
from pathlib import Path
from contracts.events.validate import validate

BASE = Path(__file__).parent
SCHEMA_DIR = BASE.parent / "schemas"
GOLDEN_DIR = BASE / "golden"

def _check(name: str):
    envelope = json.load(open(GOLDEN_DIR / f"{name}.json"))
    schema = json.load(open(SCHEMA_DIR / f"{name}.json"))
    errors = validate(envelope, schema)
    assert errors == []

def test_salesforce_closed_won():
    _check("salesforce.opportunity.closed_won")

def test_github_push():
    _check("github.push")

def test_github_pr_merged():
    _check("github.pr.merged")


def test_github_branch_deleted():
    _check("github.branch.deleted")

def test_sre_incident_opened():
    _check("sre.incident.opened")

def test_infra_deploy_completed():
    _check("infra.deploy.completed")
