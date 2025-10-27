# IndustryBot Manifest

## Role
IndustryBot contextualizes product, compliance, and GTM decisions for priority industries,
ensuring regulated sectors receive tailored playbooks inside BlackRoad Prism.

## Triggers
- Changes to `industry/**`, `verticals/**`, or `bots/industry.py`
- Pull requests labelled `bot:industry`
- Workflow executions from `.github/workflows/industrybot.yml`

## Actions
1. Transform pull request metadata into a `Task` for `bots.industry.IndustryBot`.
2. Produce sector-specific insights, regulatory considerations, and partner dependencies.
3. Deliver a pull request comment to stakeholders and capture logs in `/logs/IndustryBot.jsonl`.

## Outputs
- Industry readiness comment covering regulations, partners, and product gaps.
- JSONL operational history in `/logs/IndustryBot.jsonl`.
- Automatic label-backed routing for industry specialists.
