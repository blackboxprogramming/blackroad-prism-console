# ==== Quantum Makefile ====
SHELL := /bin/bash

HTML := apps/quantum/ternary_consciousness_v3.html
SCRIPTS := .tools/quantum

# Remote deploy env vars must be set as GitHub Secrets for CI,
# or exported locally if you run SSH steps by hand.
# SSH_HOST, SSH_USER, SSH_KEY, SITE_DOMAIN

.PHONY: patch-runtime sri commit push deploy health-remote health-local

patch-runtime:
@echo "Patching runtime snippets into $(HTML) (idempotent)…"
@grep -q "RUNTIME BADGE START" $(HTML) && echo "Already patched." || \
(awk -v RS= -v badge="$$(cat $(SCRIPTS)/runtime_badge_snippet.html)" \
     -v perf="<script>$$(sed -e 's/[\/&]/\\&/g' $(SCRIPTS)/perf_budget_snippet.js)</script>" \
     -v cons="<script>$$(sed -e 's/[\/&]/\\&/g' $(SCRIPTS)/console_only_snippet.js)</script>" \
     '{gsub(/<\/body>/, badge "\n" perf "\n" cons "\n<\/body>"); print;}' $(HTML) > $(HTML).tmp && mv $(HTML).tmp $(HTML) && echo "Patched.")
@git add $(HTML)

sri:
@echo "Computing SRI from CDN or local vendor and patching HTML…"
@bash .tools/quantum/sri.sh

commit:
git add -A
git commit -m "chore: patch runtime checks + perf budgets + console checks" || true

push:
git push -u origin HEAD || true

deploy: commit push
@echo "CI will deploy via GitHub Actions workflow."

health-remote:
@test -n "$$SITE_DOMAIN" || (echo "SITE_DOMAIN not set"; exit 1)
@curl -fsS "https://$$SITE_DOMAIN/apps/quantum/ternary_consciousness_v3.html" -o /tmp/q.html
@bytes=$$(wc -c </tmp/q.html); test $$bytes -ge 10000 || (echo "too small ($$bytes)"; exit 1)
@echo "Page OK ($$bytes bytes)"
@curl -fsS "https://$$SITE_DOMAIN/api/health/health.json" | jq .

health-local:
@url="http://localhost:8080/apps/quantum/ternary_consciousness_v3.html"; \
curl -fsS "$$url" >/dev/null && echo "Local page OK: $$url" || (echo "Local page not reachable"; exit 1)
