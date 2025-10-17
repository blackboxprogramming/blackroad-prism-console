# BlackRoad Baseline — Developer Mode Drop

The following artifacts capture the developer-mode handoff for the BlackRoad Hub and Products baseline. Each section is copy-paste ready for the target system.

## Slack

### Channels
- #announcements
- #ops
- #eng
- #products-prism
- #products-roadio
- #growth
- #helpdesk
- #security
- #random

### Pinned House Rules (post in `#announcements`)
1. Stand-up: async by 10:00 local – yesterday / today / blocked.
2. Definition of Done Done: deployable, tested, documented, demo-ready.
3. Builds: ≤10 min; never break main. If broken, stop + fix.
4. Secrets: only in 1Password; never in code/chat.
5. Friday: demo (what changed), retro (2 fixes max), next focus.

## Asana Import — "BlackRoad Ops – Today’s Push"

```csv
Task Name,Description,Assignee Email,Section,Due Date
Create Slack channels + pins,Create the standard channels and post/pin House Rules.,amundsonalexa@gmail.com,Today,2025-10-03
Wire Slack⇄Asana/Jira apps,Install + authorize apps; test /task and issue previews.,amundsonalexa@gmail.com,Today,2025-10-03
Stand up Notion Hub,Create "BlackRoad Hub" with Projects/Decisions/Risks/Vendors DBs.,amundsonalexa@gmail.com,Today,2025-10-03
Create Jira projects (HUB, PROD),Team-managed; 1-week sprints (PROD) + Kanban (HUB); add components.,amundsonalexa@gmail.com,Today,2025-10-03
Create GitHub repos,Create br-platform-hub and br-products-site in blackboxprogramming.,amundsonalexa@gmail.com,Today,2025-10-03
Apply CI + protection to repos,Add Actions CI, branch protection, CODEOWNERS, Dependabot, Snyk.,amundsonalexa@gmail.com,This Week,2025-10-04
Okta SSO skeleton,Create Okta org + apps for Slack, Asana, Jira, GitHub, Notion; plan SCIM.,amundsonalexa@gmail.com,This Week,2025-10-04
1Password vaults,Create Engineering/Ops/Finance/Marketing/Security vaults; share policy.,amundsonalexa@gmail.com,This Week,2025-10-04
DNS cutover (inc.us → Hub),Create A/CNAME for root & www; dev subdomain for staging.,amundsonalexa@gmail.com,This Week,2025-10-04
DNS for products (io → site/api/status),Create A/CNAME for root & www; api/status subdomains.,amundsonalexa@gmail.com,This Week,2025-10-04
Enable Snyk + Dependabot,Org-level policies; auto PRs; fail on high severity.,amundsonalexa@gmail.com,This Week,2025-10-04
Friday Demo #1,Demo Slack/Asana/Jira repos + CI running; note risks + next.,amundsonalexa@gmail.com,Today,2025-10-03
```

## Jira Tickets

### PROD — BlackRoad products (Scrum, 1-week sprints)

| Key | Summary | Type | Points | Labels | Component |
| --- | ------- | ---- | ------ | ------ | --------- |
| PROD-001 | Bootstrap Next.js app for products site (blackroad.io) | Story | 3 | foundation | Web |
| PROD-002 | CI workflow (lint/test/build ≤10m) | Story | 3 | ci,foundation | CI |
| PROD-003 | Create public API gateway skeleton (api.blackroad.io) | Story | 5 | api,foundation | API |
| PROD-004 | Auth stub (OIDC ready) in web/app | Story | 3 | auth | Web |
| PROD-005 | Observability: /health + structured logs | Story | 2 | obs | API |
| PROD-006 | OpenAPI doc + swagger UI scaffold | Story | 3 | api,docs | API |
| PROD-007 | Dockerfile + docker-compose for local dev | Story | 2 | devex | Platform |
| PROD-008 | Infra repo layout (terraform modules scaffold) | Story | 5 | infra,foundation | Platform |
| PROD-009 | Snyk + Dependabot on repos | Task | 1 | sec | Security |
| PROD-010 | Status page setup (status.blackroad.io) | Task | 2 | reliability | Platform |
| PROD-011 | “Done Done” checklist in repo template | Task | 1 | qa,process | Platform |
| PROD-012 | First homepage + brand stub (copy placeholders) | Story | 2 | web | Web |

### HUB — BlackRoad ops (Kanban)

| Key | Summary | Type | Points | Labels | Component |
| --- | ------- | ---- | ------ | ------ | --------- |
| HUB-001 | Create Notion “BlackRoad Hub” + DBs (Projects/Decisions/Risks/Vendors) | Task | 2 | notion | Ops |
| HUB-002 | Asana portfolio “BlackRoad Ops” + sections/fields | Task | 2 | asana | Ops |
| HUB-003 | Slack apps + channel taxonomy documented | Task | 1 | slack | Comms |
| HUB-004 | Okta org + apps (Slack, Asana, Jira, GitHub, Notion) | Epic | 8 | sso | Identity |
| HUB-005 | 1Password vault policy + naming | Task | 1 | secrets | Security |
| HUB-006 | DNS records for blackroadinc.us + blackroad.io | Task | 2 | dns | Infra |
| HUB-007 | Weekly demo/retro cadence scheduled | Task | 1 | cadence | Ops |
| HUB-008 | Risk register seeded | Task | 1 | risk | Ops |

*Components to configure in Jira: Web, API, Platform, CI, Security, Ops.*

## GitHub — Org `blackboxprogramming`

```bash
# requires GitHub CLI (gh)
ORG=blackboxprogramming
for REPO in br-platform-hub br-products-site; do
  gh repo create "$ORG/$REPO" --public --enable-issues --enable-wiki=false --add-readme
  gh secret set SNYK_TOKEN -R "$ORG/$REPO" -b"<paste-token>"
done

# in br-products-site
mkdir -p .github/workflows src apps && cat > .github/workflows/ci.yml <<'YAML'
name: ci
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  build-test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --ci
      - run: npm run build
YAML

cat > .github/dependabot.yml <<'YAML'
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "daily" }
YAML

mkdir -p .github && cat > .github/CODEOWNERS <<'TXT'
# adjust to your GitHub team/usernames
* @blackboxprogramming/admins
TXT

cat > .nvmrc <<'TXT'
v20
TXT

# Protect main on both repos
for REPO in br-platform-hub br-products-site; do
  gh api -X PUT "repos/$ORG/$REPO/branches/main/protection" \
    -F required_status_checks='{"strict":true,"contexts":["build-test"]}' \
    -F enforce_admins=true \
    -F required_pull_request_reviews='{"required_approving_review_count":1}' \
    -F restrictions='null'
done

# Apply CI to existing repo blackroad-prism-console
gh repo view $ORG/blackroad-prism-console >/dev/null && \
  gh repo set-default $ORG/blackroad-prism-console && \
  mkdir -p .github/workflows && cp ../br-products-site/.github/workflows/ci.yml .github/workflows/ci.yml && \
  git add .github && git commit -m "ci: add 10-minute build workflow" && git push
```

## Notion — Database Rows

### Projects
- **BlackRoad Hub** — Owner: Alexa Amundson; Status: Active; Repos: `br-platform-hub`; Jira Project: HUB; Start: 2025-09-29; Target Demo: 2025-10-03; Risks: Secrets sprawl; DNS misconfig.
- **BlackRoad Products Baseline** — Owner: Alexa Amundson; Status: Active; Repos: `br-products-site`, `blackroad-prism-console`; Jira Project: PROD; Start: 2025-09-29; Target Demo: 2025-10-03.

### Decisions (ADR)
- **Adopt Okta SSO for core apps** — Context: Single identity, MFA, SCIM; Slack/Asana/Jira/GitHub/Notion. Decision: Implement Okta with OIDC; enforce MFA + SCIM where available. Consequences: One front door; initial setup overhead; fewer access mistakes. Date: 2025-09-29. Owner: Alexa Amundson. Project: BlackRoad Hub.

### Risks
- **Secrets sprawl** — Likelihood: Medium; Impact: High; Mitigation: 1Password vaults by team; env injection in CI; secret scanning (Snyk/GH). Owner: Security. Status: Open. Linked Project: All.

## DNS Tasks

### blackroadinc.us (Ops Hub)
- `@` → A/CNAME to Hub host (e.g., `hub-host`).
- `www` → CNAME `@`.
- `dev` → CNAME to staging host (e.g., `dev-hub-host`).
- `id` → CNAME to Okta custom domain (once verified).

### blackroad.io (Products)
- `@` → A/CNAME to products host (e.g., `products-host`).
- `www` → CNAME `@`.
- `api` → CNAME to API gateway (e.g., `api-gw`).
- `status` → CNAME to status provider (e.g., `statuspage`).

_Set TTL to 300s during cutover and raise to 3600s after verification._

## Sprint 0 Deliverables (Done-Done)
- Slack channels live; apps installed; House Rules pinned.
- Notion Hub + databases created with seed entries above.
- Jira HUB + PROD projects created with tickets loaded.
- Repos `br-platform-hub` and `br-products-site` live with CI passing in ≤10 minutes; branch protection enabled.
- `blackroad-prism-console` CI workflow added.
- DNS records created (or change plan approved).
- Snyk + Dependabot enabled across all three repos.

