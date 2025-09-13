import json
from pathlib import Path

import jsonschema

from people import headcount


def test_headcount_schema():
    plans = Path('fixtures/people/plans.csv')
    attr = Path('fixtures/people/attrition.csv')
    transfers = Path('fixtures/people/transfers.csv')
    policy = Path('configs/people/hc_policy.yaml')
    plan, _ = headcount.forecast(plans, attr, transfers, policy)
    schema = json.loads(Path('contracts/schemas/headcount_plan.json').read_text())
    jsonschema.validate(plan, schema)
