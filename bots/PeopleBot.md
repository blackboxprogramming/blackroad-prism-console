# PeopleBot Manifest

## Role
PeopleBot stewards the employee lifecycle by supplying policy-aware guidance for talent operations,
people partners, and culture initiatives across BlackRoad Prism.

## Triggers
- Updates touching `people/**`, `hr/**`, or `bots/people.py`
- Pull requests carrying the `bot:people` label
- Runs initiated from `.github/workflows/peoplebot.yml`

## Actions
1. Collect pull request metadata and craft a `Task` envelope for `bots.people.PeopleBot`.
2. Evaluate requests spanning recruiting, onboarding, reviews, and engagement programs.
3. Deliver annotated recommendations in a pull request comment and persist telemetry to `/logs/PeopleBot.jsonl`.

## Outputs
- Comment summarizing people operations considerations, risk flags, and next steps.
- Structured JSONL entries inside `/logs/PeopleBot.jsonl`.
- Automatic routing to people domain reviewers.
