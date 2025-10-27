# ProductEngDataBot Manifest

## Role
ProductEngDataBot aligns product, engineering, and data workflows by surfacing technical risk,
analytics instrumentation, and delivery sequencing for platform squads.

## Triggers
- Changes underneath `product/**`, `engineering/**`, `data/**`, or `bots/product_eng_data.py`
- Pull requests labelled `bot:product-eng-data`
- Scheduled automation via `.github/workflows/productengdatabot.yml`

## Actions
1. Read the pull request event payload and detect product-engineering-data domain signals.
2. Run `bots.product_eng_data.ProductEngDataBot` to generate execution guidance and dependency callouts.
3. Comment with recommended delivery steps, mention domain owners, and append to `/logs/ProductEngDataBot.jsonl`.

## Outputs
- Delivery sequencing comment with KPIs, data readiness, and dependency mapping.
- JSONL audit trail inside `/logs/ProductEngDataBot.jsonl`.
- Auto-labeling support to route reviewers efficiently.
