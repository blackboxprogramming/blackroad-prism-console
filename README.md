# BlackRoad Prism Console

This repository powers the BlackRoad Prism console and a Vite/React site under `sites/blackroad`.

## Quickstart

Install dependencies:

```bash
npm ci
(cd sites/blackroad && npm i --package-lock-only)
```

## Development

```bash
cd sites/blackroad
npm run dev
```

## Build

```bash
cd sites/blackroad
npm run build
```

## Tests

```bash
npm test
```

Additional operational docs live in the [`docs/`](docs) folder.

## Codex Sync Script

The repository includes a minimal scaffold to experiment with the end-to-end
flow described in the BlackRoad deployment docs. The helper accepts natural
language commands and turns them into git/deploy operations.

```bash
python scripts/blackroad_sync.py "Push latest to BlackRoad.io"
```

Other examples:

- `python scripts/blackroad_sync.py "Refresh working copy and redeploy"`
- `python scripts/blackroad_sync.py "Rebase branch and update site"`
- `python scripts/blackroad_sync.py "Sync Salesforce → Airtable → Droplet"`

The script currently prints placeholder actions; extend the functions to hook
into real connectors and infrastructure.

## Bot Commands (ChatOps)

- `/deploy blackroad <channel> [provider]` — deploy canary/beta/prod
- `/rollback blackroad <channel> [steps] [provider]` — revert to earlier build
- `/blog new "Title"` — scaffold blog post PR
- `/promote prod` — open staging→prod PR
- `/toggle <flag> on|off` — set feature flags in `.github/feature-flags.yml`
- `/install all` — run universal installer
- `/fix <freeform prompt>` — dispatch AI Fix with your prompt

## Agents Overview

- **Auto-Heal**: reacts to failing workflows and dispatches **AI Fix**.
- **AI Fix**: runs Codex/LLM prompts, formats, builds, opens PRs.
- **AI Sweeper**: nightly formatter/linter; opens PR if needed.
- **Labeler/Stale/Lock**: repo hygiene.
- **Auto-merge**: merges labeled PRs when checks pass.
- **CodeQL/Snyk/Scorecard**: security analysis.
