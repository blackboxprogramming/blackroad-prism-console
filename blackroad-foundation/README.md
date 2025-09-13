# BlackRoad Foundation — Fully Automated Monorepo

## How this works
- PRs: lint/test/build run on every commit. Bots comment with fixes or apply them
  when you type: **@codex fix <request>** in a PR comment.
- Merge: squash & merge to `main` triggers deploy to 159.65.43.12.
- Working Copy (iOS): pull → merge → push, or push directly to `main` if allowed.
- Webhooks: GitHub repo events → https://blackroad.io/webhooks/matomo (Matomo).
- Analytics: tools/analytics_client.py sends usage/events to Matomo.

## One-time setup
- Add GitHub secrets: SSH_PRIVATE_KEY, DROPLET_HOST=159.65.43.12, USER=root,
  MATOMO_TOKEN, SLACK_WEBHOOK, GITHUB_PAT, DO_API_TOKEN (optional), etc.
- Ensure DNS A records for blackroad.io and blackroadinc.us point to 159.65.43.12.

## Commands
- pnpm i (or npm i / yarn) at root, then:
- pnpm -w run dev:api    # run API locally on :4000
- pnpm -w run build:all  # build web + api
- pnpm -w run deploy     # local -> droplet via scripts/deploy_to_droplet.sh
