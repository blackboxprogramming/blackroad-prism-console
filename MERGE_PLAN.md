# Merge Plan

## Pulse Check Status

| Item | Status | Notes |
| --- | --- | --- |
| Security sanity | In progress | Reviewing recent logs and configs to ensure no credentials or tokens are present before sign-off. |
| Tests | Scheduled | Rerunning auth and permission-focused suites; monitoring for regressions or timeout edges. |
| Merge plan | Pending review | Will proceed to main once verification steps below are complete and no blockers are reported. |

### Next Steps

- [ ] Confirm agents are configured with least-privilege access scopes.
- [ ] Review dependency versions to ensure no unplanned upgrades slip into the release.
- [ ] Validate CI/CD pipelines finish cleanly across environments.
- [ ] Monitor the first deploy window for telemetry anomalies or drift.

## Pull Requests

| PR | Title | State | Impacts | Risks |
|---|---|---|---|---|
| #1016 | feat: wire nginx health and telemetry | open | api | conflicts with PR #1023; conflicts with PR #1020; conflicts with PR #1014; conflicts with PR #1027; conflicts with PR #1024; conflicts with PR #1021 |
| #1015 | feat: add observability and readiness for ollama bridge | open | bridge | package.json with type module present; conflicts with PR #1014; conflicts with PR #1029; conflicts with PR #1026; conflicts with PR #1012 |
| #1029 | feat: add observability and readiness for ollama bridge | merged | bridge | package.json with type module present; conflicts with PR #1015; conflicts with PR #1014; conflicts with PR #1026; conflicts with PR #1012 |
| #1026 | feat: secure llm bridge with origin auth and model switcher | merged | bridge | package.json with type module present; conflicts with PR #1015; conflicts with PR #1014; conflicts with PR #1029; conflicts with PR #1012 |
| #1021 | feat: add mtls partner relay | merged | api, nginx | conflicts with PR #1023; conflicts with PR #1020; conflicts with PR #1016; conflicts with PR #1014; conflicts with PR #1027; conflicts with PR #1024 |
| #1023 | Add Yjs collaborative editing server and client | open | api, ui | conflicts with PR #1020; conflicts with PR #1016; conflicts with PR #1014; conflicts with PR #1027; conflicts with PR #1024; conflicts with PR #1021 |
| #1022 | Add collaboration presence bus, LED webhooks, and voice room | open | ui | none |
| #1020 | Add devices backplane with WebSocket endpoints and admin UI | open | api, ui | conflicts with PR #1023; conflicts with PR #1016; conflicts with PR #1027; conflicts with PR #1024; conflicts with PR #1021 |
| #1014 | feat: secure llm bridge with origin auth and model switcher | open | bridge, ui | package.json with type module present; conflicts with PR #1023; conflicts with PR #1016; conflicts with PR #1015; conflicts with PR #1029; conflicts with PR #1026; conflicts with PR #1021; conflicts with PR #1012 |
| #1027 | feat: add project rooms API and UI | merged | api, ui | conflicts with PR #1023; conflicts with PR #1020; conflicts with PR #1016; conflicts with PR #1024; conflicts with PR #1021 |
| #1024 | Add devices backplane with WebSocket endpoints and admin UI | merged | api, ui | conflicts with PR #1023; conflicts with PR #1020; conflicts with PR #1016; conflicts with PR #1027; conflicts with PR #1021 |
| #1012 | feat: identity beacon, streaming bridge, and snapshots | merged | bridge, ui, units | package.json with type module present; conflicts with PR #1015; conflicts with PR #1014; conflicts with PR #1029; conflicts with PR #1026 |
| #1017 | fix(webber): centralize prettier execution | open | none | conflicts with PR #1011; conflicts with PR #1007; conflicts with PR #1006; conflicts with PR #1013; conflicts with PR #1008 |
| #1011 | feat(agents): add webber bot for web file editing | open | none | conflicts with PR #1017; conflicts with PR #1007; conflicts with PR #1006; conflicts with PR #1013; conflicts with PR #1008 |
| #1010 | Enhance cleanup bot with summary and error handling | open | none | conflicts with PR #999; conflicts with PR #998 |
| #1007 | Add WebberBot for web file formatting | open | none | conflicts with PR #1017; conflicts with PR #1011; conflicts with PR #1006; conflicts with PR #1013; conflicts with PR #1008 |
| #1006 | feat(agents): add webber bot for web file editing | open | none | conflicts with PR #1017; conflicts with PR #1011; conflicts with PR #1007; conflicts with PR #1013; conflicts with PR #1008 |
| #1001 | docs: clarify athena orchestrator | open | none | conflicts with PR #1025; conflicts with PR #1002 |
| #1000 | docs: document active agents | open | none | none |
| #999 | feat: summarize cleanup results | open | none | conflicts with PR #1010; conflicts with PR #998 |
| #998 | feat: summarize cleanup results | open | none | conflicts with PR #1010; conflicts with PR #999 |
| #996 | Add PR automation bot and workflow | open | none | conflicts with PR #1004 |
| #987 | Add agent test runner script | open | none | conflicts with PR #997 |
| #983 | chore(deps): bump recharts from 2.15.4 to 3.1.2 in /sites/blackroad | open | none | conflicts with PR #982; conflicts with PR #981 |
| #982 | chore(deps-dev): bump tailwindcss from 3.4.17 to 4.1.13 in /sites/blackroad | open | none | conflicts with PR #983; conflicts with PR #981 |
| #981 | chore(deps): bump react-dom and @types/react-dom in /sites/blackroad | open | none | conflicts with PR #983; conflicts with PR #982 |
| #1031 | Add Collatz campaign framework with CI smoke test | merged | none | none |
| #1030 | Fix Hello World Playwright test to use static blog asset | merged | none | none |
| #1028 | Add collab presence demo page | merged | none | none |
| #1025 | docs: clarify athena orchestrator | merged | none | conflicts with PR #1001; conflicts with PR #1002 |
| #1019 | fix: lazy-load lucidia math modules to avoid optional deps | merged | none | none |
| #1018 | docs: add micro-os device backplane prompt | merged | none | none |
| #1013 | feat(agents): add webber bot for web file editing | merged | none | conflicts with PR #1017; conflicts with PR #1011; conflicts with PR #1007; conflicts with PR #1006; conflicts with PR #1008 |
| #1009 | feat: add Athena orchestrator agent | merged | none | none |
| #1008 | Add WebberBot for web file formatting | merged | none | conflicts with PR #1017; conflicts with PR #1011; conflicts with PR #1007; conflicts with PR #1006; conflicts with PR #1013 |
| #1005 | docs: expand agent workboard tasks | merged | none | none |
| #1004 | Add PR automation bot and workflow | merged | none | conflicts with PR #996 |
| #1003 | Add Athena orchestrator and manifest | merged | none | none |
| #1002 | feat: add Athena orchestrator | merged | none | conflicts with PR #1001; conflicts with PR #1025 |
| #997 | feat: recursively test agents | merged | none | conflicts with PR #987 |

## Operational Checklist

Refer to [`docs/mainline-cleanup.md`](docs/mainline-cleanup.md) for the detailed triage→handoff flow that consolidates these steps with the cleanup findings and agent command palette.

- [ ] **Security sweep:** confirm credentials, tokens, and secrets are not present in logs or configuration artifacts.
- [ ] **Test verification:** rerun automated suites with emphasis on authentication, authorization, and timeout edge cases.
- [ ] **Least-privilege review:** ensure all agents and services operate with minimally required scopes and permissions.
- [ ] **Dependency audit:** verify dependency versions match expectations and that no implicit upgrades are introduced.
- [ ] **CI/CD parity:** validate pipeline runs are clean and environments remain consistent across test, staging, and production.
- [ ] **Deploy monitoring:** monitor the first deployment window for anomalous telemetry spikes or unexpected behavior.

## Dependency Graph

```
api,yjs,bridge,jsond -> nginx -> ui
```

## Topological Merge Queue

1. PR #1016 - feat: wire nginx health and telemetry (api)
1. PR #1015 - feat: add observability and readiness for ollama bridge (bridge)
1. PR #1029 - feat: add observability and readiness for ollama bridge (bridge)
1. PR #1026 - feat: secure llm bridge with origin auth and model switcher (bridge)
1. PR #1021 - feat: add mtls partner relay (api, nginx)
1. PR #1023 - Add Yjs collaborative editing server and client (api, ui)
1. PR #1022 - Add collaboration presence bus, LED webhooks, and voice room (ui)
1. PR #1020 - Add devices backplane with WebSocket endpoints and admin UI (api, ui)
1. PR #1014 - feat: secure llm bridge with origin auth and model switcher (bridge, ui)
1. PR #1027 - feat: add project rooms API and UI (api, ui)
1. PR #1024 - Add devices backplane with WebSocket endpoints and admin UI (api, ui)
1. PR #1012 - feat: identity beacon, streaming bridge, and snapshots (bridge, ui, units)
1. PR #1017 - fix(webber): centralize prettier execution ()
1. PR #1011 - feat(agents): add webber bot for web file editing ()
1. PR #1010 - Enhance cleanup bot with summary and error handling ()
1. PR #1007 - Add WebberBot for web file formatting ()
1. PR #1006 - feat(agents): add webber bot for web file editing ()
1. PR #1001 - docs: clarify athena orchestrator ()
1. PR #1000 - docs: document active agents ()
1. PR #999 - feat: summarize cleanup results ()
1. PR #998 - feat: summarize cleanup results ()
1. PR #996 - Add PR automation bot and workflow ()
1. PR #987 - Add agent test runner script ()
1. PR #983 - chore(deps): bump recharts from 2.15.4 to 3.1.2 in /sites/blackroad ()
1. PR #982 - chore(deps-dev): bump tailwindcss from 3.4.17 to 4.1.13 in /sites/blackroad ()
1. PR #981 - chore(deps): bump react-dom and @types/react-dom in /sites/blackroad ()
1. PR #1031 - Add Collatz campaign framework with CI smoke test ()
1. PR #1030 - Fix Hello World Playwright test to use static blog asset ()
1. PR #1028 - Add collab presence demo page ()
1. PR #1025 - docs: clarify athena orchestrator ()
1. PR #1019 - fix: lazy-load lucidia math modules to avoid optional deps ()
1. PR #1018 - docs: add micro-os device backplane prompt ()
1. PR #1013 - feat(agents): add webber bot for web file editing ()
1. PR #1009 - feat: add Athena orchestrator agent ()
1. PR #1008 - Add WebberBot for web file formatting ()
1. PR #1005 - docs: expand agent workboard tasks ()
1. PR #1004 - Add PR automation bot and workflow ()
1. PR #1003 - Add Athena orchestrator and manifest ()
1. PR #1002 - feat: add Athena orchestrator ()
1. PR #997 - feat: recursively test agents ()

## Preflight & Verify

### PR #1016
**Preflight**
- `systemctl restart blackroad-api`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1015
**Preflight**
- `systemctl restart ollama-bridge`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1029
**Preflight**
- `systemctl restart ollama-bridge`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1026
**Preflight**
- `systemctl restart ollama-bridge`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1021
**Preflight**
- `systemctl restart blackroad-api`
- `nginx -t && systemctl reload nginx`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1023
**Preflight**
- `systemctl restart blackroad-api`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1022
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1020
**Preflight**
- `systemctl restart blackroad-api`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1014
**Preflight**
- `systemctl restart ollama-bridge`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1027
**Preflight**
- `systemctl restart blackroad-api`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1024
**Preflight**
- `systemctl restart blackroad-api`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1012
**Preflight**
- `systemctl restart ollama-bridge`
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1017
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1011
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1010
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1007
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1006
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1001
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1000
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #999
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #998
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #996
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #987
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #983
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #982
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #981
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1031
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1030
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1028
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1025
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1019
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1018
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1013
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1009
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1008
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1005
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1004
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1003
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #1002
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

### PR #997
**Preflight**
**Verify**
- `curl -s https://blackroad.io/healthz`
- `curl -s http://127.0.0.1:4010/api/llm/health`
- `curl -s http://127.0.0.1:12345/yjs/test`
- `curl -s -o /dev/null -w '%{http_code}' https://blackroad.io/relay | grep 403`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/projects`
- `curl -s -H 'X-BlackRoad-Key: $BLACKROAD_KEY' https://blackroad.io/api/devices`

## Fix-Forward Tasks

- ✅ Added `srv/ollama-bridge/package.json` with `{ "type": "module" }` to support bridge ESM builds.
