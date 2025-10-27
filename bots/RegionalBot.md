# RegionalBot Manifest

## Role
RegionalBot adapts product and operational plans for regional nuances covering regulatory,
localization, and market activation considerations across AMER, EMEA, and APAC.

## Triggers
- Pull requests modifying `regional/**`, `localization/**`, or `bots/regional.py`
- Issues labelled `bot:regional`
- Automation triggered through `.github/workflows/regionalbot.yml`

## Actions
1. Convert pull request metadata into a `Task` for `bots.regional.RegionalBot`.
2. Analyze regional compliance, localization, and operational requirements.
3. Respond on the pull request with geo-specific guidance and emit logs to `/logs/RegionalBot.jsonl`.

## Outputs
- Regional readiness comment enumerating compliance checks and localization tasks.
- JSONL audit entries appended at `/logs/RegionalBot.jsonl`.
- Automatic routing to regional operations reviewers.
