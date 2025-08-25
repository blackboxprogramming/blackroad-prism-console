# CodeFix Bot

Autonomous service that watches GitHub for issues labelled `bug`, `fix`, `lint` or comments containing `@codefix fix this`. When triggered it attempts to reproduce the failure, propose a patch via an LLM and open a Pull Request.

## Setup

1. Copy `srv/codefix-bot/.env.example` to `.env` and fill in tokens.
2. Ensure `/var/log/codefix-bot` is writable.
3. Start the service:
   ```bash
   node srv/codefix-bot/server.js
   ```
4. Expose port `4100` as `/api/codefix` through your proxy.

## GitHub Integration

Provide a Personal Access Token with repo scope in `GITHUB_TOKEN`. Configure a webhook on the target repositories pointing to `/api/webhooks/github` using `GITHUB_WEBHOOK_SECRET`.

## Manual Trigger

`POST /api/fix/:repo/:issueId` with header `Authorization: Bearer $INTERNAL_TOKEN` will queue a job. Append `?dry=true` for dry-run mode.

## Logs

Job logs are written to `/var/log/codefix-bot/` and listed via `GET /api/jobs`.

## Safety

* Branch names use `codefix/*`.
* Max diff applied is limited by the LLM prompt.
* Requires PR review before merge.
