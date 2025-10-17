# PagerDuty workflow rollout blurbs

## #releases

PD workflow complete:
- Red card → Create PD with auto-assignees & runbook
- Resolve PD from the Heatmap (adds post-mortem link)
- “PD Sweep” opens one coordination incident if multiple yellows
- Spam guard prevents duplicate incidents

## #security

PD API token stays in SSM; endpoints are Ops/Sec only and audited.
Auto-assign maps by system; tweak assignees/urgency in config.
